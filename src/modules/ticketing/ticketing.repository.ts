import { prisma } from '../../shared/prisma';
import { DEFAULT_PAGE_SIZE } from '../../shared/types';

export const ticketingRepository = {
  findScreeningById: (id: string) =>
    prisma.screening.findUnique({
      where: { id },
      include: { movie: { select: { id: true, title: true } } },
    }),

  /**
   * FR-010: チケット購入履歴一覧
   * C-AUTH-004: userId で絞り込み
   */
  async getPurchaseHistory(userId: string, page = 1) {
    const skip = (page - 1) * DEFAULT_PAGE_SIZE;
    const [items, total] = await Promise.all([
      prisma.ticketPurchase.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              screening: {
                include: { movie: { select: { id: true, title: true } } },
              },
            },
          },
        },
        orderBy: { purchasedAt: 'desc' }, // FR-010: 購入日降順
        skip,
        take: DEFAULT_PAGE_SIZE,
      }),
      prisma.ticketPurchase.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      perPage: DEFAULT_PAGE_SIZE,
      totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
    };
  },

  /** FR-010: 購入詳細 */
  findPurchaseById: (id: string) =>
    prisma.ticketPurchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            screening: {
              include: { movie: { select: { id: true, title: true } } },
            },
          },
        },
      },
    }),
};
