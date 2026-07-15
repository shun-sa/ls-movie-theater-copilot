import { prisma } from '../../shared/prisma';
import { ticketingRepository } from './ticketing.repository';
import { TicketPurchaseInput, TICKET_PRICES } from './ticketing.schema';
import {
  NotFoundError,
  InsufficientSeatsError,
  SalesOutOfPeriodError,
} from '../../shared/errors';
import {
  generatePurchaseNumber,
  isScreeningSaleAvailable,
} from '../../shared/types';

export const ticketingService = {
  /**
   * FR-009: チケット購入確定
   * ADR-003: SELECT FOR UPDATE + Prismaトランザクションで残席排他制御
   * ADR-004: TicketPurchaseItemにスナップショット（券種・単価）を保持
   * NFR-AVL-002, NFR-AVL-004: 購入登録と残席減算の整合性
   * CON-002: 模擬決済（常に成功）
   */
  async purchaseTicket(userId: string, input: TicketPurchaseInput) {
    const purchase = await prisma.$transaction(async (tx) => {
      // SELECT FOR UPDATE で上映回を排他ロック (ADR-003)
      const [screening] = await tx.$queryRaw<
        {
          id: string;
          movie_id: string;
          starts_at: Date;
          theater_name: string;
          screen_name: string;
          seats_remaining: number;
          sales_start_at: Date | null;
          sales_end_at: Date | null;
        }[]
      >`SELECT id, movie_id, starts_at, theater_name, screen_name, seats_remaining, sales_start_at, sales_end_at FROM screenings WHERE id = ${input.screeningId} FOR UPDATE`;

      if (!screening) throw new NotFoundError('上映回');

      // ADR-003: 販売期間確認（OQ-002解決）
      if (
        !isScreeningSaleAvailable({
          startsAt: screening.starts_at,
          salesStartAt: screening.sales_start_at,
          salesEndAt: screening.sales_end_at,
        })
      ) {
        throw new SalesOutOfPeriodError();
      }

      // 残席確認 (ERR-003)
      if (screening.seats_remaining < input.quantity) {
        throw new InsufficientSeatsError();
      }

      // 残席減算
      await tx.screening.update({
        where: { id: input.screeningId },
        data: { seatsRemaining: { decrement: input.quantity } },
      });

      // ADR-004: 券種・単価スナップショットを TicketPurchaseItem に保持
      const unitPrice = TICKET_PRICES[input.ticketType] ?? 1800;
      const totalAmount = unitPrice * input.quantity;

      const newPurchase = await tx.ticketPurchase.create({
        data: {
          purchaseNumber: generatePurchaseNumber(),
          userId,
          totalAmount,
          items: {
            create: {
              screeningId: input.screeningId,
              ticketType: input.ticketType,
              unitPrice,
              quantity: input.quantity,
            },
          },
        },
        include: {
          items: {
            include: {
              screening: {
                include: { movie: { select: { id: true, title: true } } },
              },
            },
          },
        },
      });

      return newPurchase;
    }); // コミット or 例外時は自動ロールバック (ERR-005, NFR-AVL-004)

    return purchase;
  },

  /** FR-010: チケット購入履歴一覧 (C-AUTH-004) */
  getPurchaseHistory: (userId: string, page?: number) =>
    ticketingRepository.getPurchaseHistory(userId, page),

  /** FR-010: 購入詳細 (C-AUTH-004: 本人のみ) */
  async getPurchaseDetail(userId: string, purchaseId: string) {
    const purchase = await ticketingRepository.findPurchaseById(purchaseId);
    if (!purchase) throw new NotFoundError('チケット購入');
    if (purchase.userId !== userId) throw new NotFoundError('チケット購入');
    return purchase;
  },
};
