import { prisma } from '../../shared/prisma';
import { cartRepository } from './cart.repository';
import { productRepository } from './movie-product.repository';
import {
  NotFoundError,
  InsufficientStockError,
  SalesOutOfPeriodError,
  ForbiddenError,
} from '../../shared/errors';
import { isProductSaleAvailable } from '../../shared/types';

export const cartService = {
  /** FR-006: カートを取得 */
  async getCart(userId: string) {
    const cart = await cartRepository.getOrCreate(userId);
    return cart;
  },

  /**
   * FR-006: カートに商品追加
   * 業務ルール: カート追加時は在庫減算しない（在庫チェックのみ）
   * C-DATA-002, C-DATA-003: 販売可否・在庫確認
   */
  async addItem(userId: string, productId: string, quantity: number) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('商品');

    if (!isProductSaleAvailable(product)) throw new SalesOutOfPeriodError();
    if (product.stock < quantity) throw new InsufficientStockError(product.name);

    const cart = await cartRepository.getOrCreate(userId);

    // 既存カートアイテムの数量を考慮した在庫チェック
    const existingItem = cart.items.find((i) => i.productId === productId);
    const totalQty = (existingItem?.quantity ?? 0) + quantity;
    if (product.stock < totalQty) throw new InsufficientStockError(product.name);

    await cartRepository.upsertItem(cart.id, productId, quantity);
    return cartRepository.getOrCreate(userId);
  },

  /**
   * FR-007: 数量変更
   * ADR-005: user_id で cart を照合（他会員のカート操作を防止）
   */
  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await cartRepository.findCartByUserId(userId);
    if (!cart) throw new NotFoundError('カート');

    if (quantity > 0) {
      const product = await productRepository.findById(productId);
      if (!product) throw new NotFoundError('商品');
      if (product.stock < quantity) throw new InsufficientStockError(product.name);
    }

    await cartRepository.updateItemQuantity(cart.id, productId, quantity);
    return cartRepository.getOrCreate(userId);
  },

  /**
   * FR-007: 商品削除
   * C-AUTH-004: 自分のカートのみ操作可能
   */
  async removeItem(userId: string, productId: string) {
    const cart = await cartRepository.findCartByUserId(userId);
    if (!cart) throw new NotFoundError('カート');

    await cartRepository.deleteItem(cart.id, productId);
    return cartRepository.getOrCreate(userId);
  },

  /**
   * FR-007エラー条件: 注文不可商品がある場合チェック
   * FR-008: 注文手続き開始前に再チェック
   */
  async validateCartForOrder(userId: string) {
    const cart = await cartRepository.getOrCreate(userId);
    const now = new Date();
    const invalidItems: string[] = [];

    for (const item of cart.items) {
      const p = item.product;
      if (
        p.publishStatus !== 'published' ||
        (p.salesStartAt && p.salesStartAt > now) ||
        (p.salesEndAt && p.salesEndAt < now) ||
        p.stock < item.quantity
      ) {
        invalidItems.push(p.name);
      }
    }

    return { cart, invalidItems };
  },
};
