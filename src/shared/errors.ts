// アプリケーション固有のエラークラス定義
// ERR-001〜005 の各エラー種別に対応

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** ERR-001: 入力バリデーションエラー */
export class ValidationError extends AppError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/** ERR-002: 認証失敗（アカウント存在有無を推測させない汎用メッセージ） */
export class AuthenticationError extends AppError {
  constructor() {
    super(401, 'メールアドレスまたはパスワードが正しくありません', 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/** ERR-002: 未認証アクセス */
export class UnauthorizedError extends AppError {
  constructor() {
    super(401, '認証が必要です', 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/** ERR-004: 権限不足 */
export class ForbiddenError extends AppError {
  constructor() {
    super(403, 'アクセス権限がありません', 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/** ERR-003: 在庫不足 */
export class InsufficientStockError extends AppError {
  constructor(productName?: string) {
    super(409, productName ? `「${productName}」の在庫が不足しています` : '在庫が不足しています', 'INSUFFICIENT_STOCK');
    this.name = 'InsufficientStockError';
  }
}

/** ERR-003: 残席不足 */
export class InsufficientSeatsError extends AppError {
  constructor() {
    super(409, '残席数が不足しています', 'INSUFFICIENT_SEATS');
    this.name = 'InsufficientSeatsError';
  }
}

/** ERR-004: 販売期間外 */
export class SalesOutOfPeriodError extends AppError {
  constructor() {
    super(409, '販売期間外のため購入できません', 'SALES_OUT_OF_PERIOD');
    this.name = 'SalesOutOfPeriodError';
  }
}

/** リソースが見つからない */
export class NotFoundError extends AppError {
  constructor(resource = 'リソース') {
    super(404, `${resource}が見つかりません`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/** メール重複 */
export class DuplicateEmailError extends AppError {
  constructor() {
    super(409, 'このメールアドレスは既に登録されています', 'DUPLICATE_EMAIL');
    this.name = 'DuplicateEmailError';
  }
}
