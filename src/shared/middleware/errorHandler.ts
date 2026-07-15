import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors';

/**
 * 集中エラーハンドラー (ERR-001〜005)
 * ERR-002: 認証エラーメッセージは汎用文言のみ（アカウント存在推測不可）
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      fields: err.fields,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  // 予期しないエラーは内部情報を漏洩しない
  console.error('[UnhandledError]', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'サーバーエラーが発生しました',
  });
}
