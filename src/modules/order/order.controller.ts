import { Request, Response, NextFunction } from 'express';
import { cartService } from './cart.service';
import { orderService } from './order.service';
import {
  AddToCartSchema,
  UpdateCartItemSchema,
  OrderSchema,
} from './order.schema';
import { ValidationError, UnauthorizedError } from '../../shared/errors';

export const cartController = {
  /** GET /api/v1/cart — FR-006 */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());
      const cart = await cartService.getCart(req.user.userId);
      res.json({ data: cart });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/cart/items — FR-006: カートに追加 */
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());

      const parsed = AddToCartSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.fromEntries(
          parsed.error.errors.map((e) => [e.path.join('.'), e.message])
        );
        return next(new ValidationError('入力内容に誤りがあります', fields));
      }

      const cart = await cartService.addItem(
        req.user.userId,
        parsed.data.productId,
        parsed.data.quantity
      );
      res.status(201).json({ data: cart, message: 'カートに追加しました' });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/v1/cart/items/:productId — FR-007: 数量変更 */
  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());

      const parsed = UpdateCartItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError('数量の入力が正しくありません'));
      }

      const cart = await cartService.updateItem(
        req.user.userId,
        req.params.productId,
        parsed.data.quantity
      );
      res.json({ data: cart });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/v1/cart/items/:productId — FR-007: 削除 */
  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());
      const cart = await cartService.removeItem(req.user.userId, req.params.productId);
      res.json({ data: cart });
    } catch (err) {
      next(err);
    }
  },
};

export const orderController = {
  /** POST /api/v1/orders — FR-008: 注文確定 */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());

      const parsed = OrderSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.fromEntries(
          parsed.error.errors.map((e) => [e.path.join('.'), e.message])
        );
        return next(new ValidationError('入力内容に誤りがあります', fields));
      }

      const order = await orderService.createOrder(req.user.userId, parsed.data);
      res.status(201).json({ data: order, message: '注文が確定しました' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/orders — FR-010: 注文履歴一覧 */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());
      const page = req.query.page ? Number(req.query.page) : 1;
      const result = await orderService.getOrderHistory(req.user.userId, page);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/orders/:id — FR-010: 注文詳細 */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());
      const order = await orderService.getOrderDetail(req.user.userId, req.params.id);
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  },
};
