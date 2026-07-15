import { Router } from 'express';
import { movieController, productController } from './movie-product.controller';
import { cartController, orderController } from './order.controller';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/auth';

// 映画ルーター (FR-003, FR-004)
export const movieRouter = Router();
movieRouter.get('/', optionalAuthenticate, movieController.search);
movieRouter.get('/:id', optionalAuthenticate, movieController.findById);

// 商品ルーター (FR-005)
export const productRouter = Router();
productRouter.get('/', optionalAuthenticate, productController.search);
productRouter.get('/:id', optionalAuthenticate, productController.findById);

// カートルーター (FR-006, FR-007) — 認証必須 (C-AUTH-002)
export const cartRouter = Router();
cartRouter.use(authenticate);
cartRouter.get('/', cartController.get);
cartRouter.post('/items', cartController.addItem);
cartRouter.patch('/items/:productId', cartController.updateItem);
cartRouter.delete('/items/:productId', cartController.removeItem);

// 注文ルーター (FR-008, FR-010) — 認証必須 (C-AUTH-002)
export const orderRouter = Router();
orderRouter.use(authenticate);
orderRouter.post('/', orderController.create);
orderRouter.get('/', orderController.list);
orderRouter.get('/:id', orderController.findById);
