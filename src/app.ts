import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.router';
import {
  movieRouter,
  productRouter,
  cartRouter,
  orderRouter,
} from './modules/order/order.router';
import ticketingRouter from './modules/ticketing/ticketing.router';
import { errorHandler } from './shared/middleware/errorHandler';

const app = express();

// ミドルウェア設定
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true, // ADR-002: Cookie送受信を許可
  })
);
app.use(express.json());
app.use(cookieParser());

// APIルーター (ADR-001: /api/v1/ プレフィクス統一)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/movies', movieRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/tickets', ticketingRouter);

// ヘルスチェック
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 集中エラーハンドラー (ERR-001〜005)
app.use(errorHandler);

export default app;
