import { prisma } from '../../shared/prisma';

export const cartRepository = {
  /** カートを取得（なければ作成） — ADR-005 */
  async getOrCreate(userId: string) {
    const existing = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { addedAt: 'asc' },
        },
      },
    });

    if (existing) return existing;

    return prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { addedAt: 'asc' },
        },
      },
    });
  },

  /**
   * カートに商品追加 (FR-006)
   * 同一商品は数量加算 (UPSERT)
   */
  async upsertItem(cartId: string, productId: string, quantity: number) {
    return prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
    });
  },

  /** FR-007: 数量変更 */
  async updateItemQuantity(cartId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      // 数量0は削除扱い (FR-007)
      return prisma.cartItem.delete({
        where: { cartId_productId: { cartId, productId } },
      });
    }
    return prisma.cartItem.update({
      where: { cartId_productId: { cartId, productId } },
      data: { quantity },
    });
  },

  /** FR-007: 商品削除 */
  deleteItem: (cartId: string, productId: string) =>
    prisma.cartItem.delete({
      where: { cartId_productId: { cartId, productId } },
    }),

  /** FR-008: 注文確定後カートクリア */
  clearItems: (cartId: string) =>
    prisma.cartItem.deleteMany({ where: { cartId } }),

  /** ADR-005: cartId から cart を取得（userId 照合用） */
  findCartByUserId: (userId: string) =>
    prisma.cart.findUnique({ where: { userId } }),
};
