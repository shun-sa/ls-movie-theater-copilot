import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { RegisterSchema, LoginSchema } from './auth.schema';
import { ValidationError, UnauthorizedError } from '../../shared/errors';

export const authController = {
  /** POST /api/v1/auth/register — FR-001 */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        const fields = Object.fromEntries(
          parsed.error.errors.map((e) => [e.path.join('.'), e.message])
        );
        return next(new ValidationError('入力内容に誤りがあります', fields));
      }

      const user = await authService.register(parsed.data);

      // 登録完了後、自動ログイン (FR-001完了条件)
      const token = await authService.login({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      setTokenCookie(res, token);
      res.status(201).json({ data: user, message: '会員登録が完了しました' });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/auth/login — FR-002 */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError('入力内容に誤りがあります'));
      }

      const token = await authService.login(parsed.data);
      setTokenCookie(res, token);
      res.json({ message: 'ログインしました' });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/auth/logout */
  logout(_req: Request, res: Response) {
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
    res.json({ message: 'ログアウトしました' });
  },

  /** GET /api/v1/auth/me */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new UnauthorizedError());
      const user = await authService.getMe(req.user.userId);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },
};

/**
 * ADR-002: HttpOnly; SameSite=Strict でJWTをCookieに設定
 * NFR-SEC-005: XSS/CSRF対策
 */
function setTokenCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24時間
  });
}
