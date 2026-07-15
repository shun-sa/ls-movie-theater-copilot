import { Request, Response, NextFunction } from 'express';
import { ticketingService } from './ticketing.service';
import { TicketPurchaseSchema } from './ticketing.schema';
import { ValidationError, UnauthorizedError } from '../../shared/errors';

export const ticketingController = {
  /** POST /api/v1/tickets — FR-009: チケット購入 */
  async purchase(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());

      const parsed = TicketPurchaseSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.fromEntries(
          parsed.error.errors.map((e) => [e.path.join('.'), e.message])
        );
        return next(new ValidationError('入力内容に誤りがあります', fields));
      }

      const purchase = await ticketingService.purchaseTicket(req.user.userId, parsed.data);
      res.status(201).json({ data: purchase, message: 'チケット購入が完了しました' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/tickets — FR-010: チケット購入履歴一覧 */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());
      const page = req.query.page ? Number(req.query.page) : 1;
      const result = await ticketingService.getPurchaseHistory(req.user.userId, page);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/tickets/:id — FR-010: 購入詳細 */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());
      const purchase = await ticketingService.getPurchaseDetail(req.user.userId, req.params.id);
      res.json({ data: purchase });
    } catch (err) {
      next(err);
    }
  },
};
