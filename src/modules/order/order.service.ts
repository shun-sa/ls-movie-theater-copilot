import { prisma } from '../../shared/prisma';
import { cartRepository } from './cart.repository';
import { cartService } from './cart.service';
import { OrderInput } from './order.schema';
import {
  NotFoundError,
  InsufficientStockError,
  ValidationError,
} from '../../shared/errors';
import {
  ORDER_STATUS,
  generateOrderNumber,
  isProductSaleAvailable,
} from '../../shared/types';
import { DEFAULT_PAGE_SIZE } from '../../shared/types';

export const orderService = {
  /**
   * FR-008: 商品注文確定
   * ADR-003: SELECT FOR UPDATE + Prismaトランザクションで排他制御
   * ADR-004: OrderItemにスナップショットを保持
   * ADR-007: 模擬決済（CON-002）のため直接 confirmed をセット
   * NFR-AVL-001, NFR-AVL-003: 注文登録と在庫減算の整合性
   */
  async createOrder(userId: string, input: OrderInput) {
    // カートバリデーション (FR-007エラー条件)
    const { cart, invalidItems } = await cartService.validateCartForOrder(userId);
    if (cart.items.length === 0) {
      throw new ValidationError('カートが空です');
    }
    if (invalidItems.length > 0) {
      throw new ValidationError(
        `以下の商品が購入できない状態です: ${invalidItems.join(', ')}`
      );
    }

    // ADR-003: トランザクション内で排他制御
    const order = await prisma.$transaction(async (tx) => {
      // 各商品をFOR UPDATEでロック取得・在庫確認・減算
      const orderItems: {
        productId: string;
        productSnapshotName: string;
        unitPrice: number;
        quantity: number;
        subtotal: number;
      }[] = [];

      // デッドロック防止: productId 昇順でロック取得 (ADR-003)
      const sortedItems = [...cart.items].sort((a, b) =>
        a.productId.localeCompare(b.productId)
      );

      for (const item of sortedItems) {
        // SELECT FOR UPDATE で排他ロック
        const [product] = await tx.$queryRaw<
          { id: string; name: string; price_tax_included: number; stock: number; publish_status: string; sales_start_at: Date | null; sales_end_at: Date | null }[]
        >`SELECT id, name, price_tax_included, stock, publish_status, sales_start_at, sales_end_at FROM products WHERE id = ${item.productId} FOR UPDATE`;

        if (!product) throw new NotFoundError('商品');

        // 在庫再確認（在庫不足なら例外 → 自動ロールバック）
        if (product.stock < item.quantity) {
          throw new InsufficientStockError(product.name);
        }
        if (!isProductSaleAvailable({
          publishStatus: product.publish_status,
          salesStartAt: product.sales_start_at,
          salesEndAt: product.sales_end_at,
          stock: product.stock,
        })) {
          throw new ValidationError(`「${product.name}」は現在購入できません`);
        }

        // 在庫減算
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        // ADR-004: スナップショットを OrderItem に保持
        orderItems.push({
          productId: item.productId,
          productSnapshotName: product.name,
          unitPrice: product.price_tax_included,
          quantity: item.quantity,
          subtotal: product.price_tax_included * item.quantity,
        });
      }

      const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

      // 注文レコード作成
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: ORDER_STATUS.CONFIRMED, // CON-002: 模擬決済は常に成功
          shippingName: input.shippingName,
          postalCode: input.postalCode,
          prefecture: input.prefecture,
          addressLine: input.addressLine,
          phoneNumber: input.phoneNumber,
          paymentMethod: input.paymentMethod,
          totalAmount,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // カートクリア
      await cartRepository.clearItems(cart.id);

      return newOrder;
    }); // コミット or 例外時は自動ロールバック (ERR-005)

    return order;
  },

  /**
   * FR-010: 購入履歴（商品注文）一覧
   * C-AUTH-004: userId で絞り込み
   */
  async getOrderHistory(userId: string, page = 1) {
    const skip = (page - 1) * DEFAULT_PAGE_SIZE;
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { orderedAt: 'desc' }, // FR-010: 注文日降順
        skip,
        take: DEFAULT_PAGE_SIZE,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items, total, page, perPage: DEFAULT_PAGE_SIZE, totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE) };
  },

  /** FR-010: 注文詳細 (C-AUTH-004: 本人のみ) */
  async getOrderDetail(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('注文');
    if (order.userId !== userId) throw new NotFoundError('注文'); // 他会員の注文は404で隠蔽
    return order;
  },
};
