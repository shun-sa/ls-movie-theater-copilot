import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';

export interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT認証ミドルウェア (ADR-002)
 * HttpOnly Cookieからトークンを検証し req.user にセットする
 * C-AUTH-002, C-AUTH-003 対応
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    return next(new UnauthorizedError());
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError());
  }
}

/**
 * オプショナル認証ミドルウェア
 * トークンがあれば req.user にセット、なくてもエラーにしない
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return next();

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
  } catch {
    // 無効なトークンは無視
  }
  next();
}
