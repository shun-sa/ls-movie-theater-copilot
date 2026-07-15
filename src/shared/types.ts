// 共通レスポンス型・ユーティリティ

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiResponse<T = void> {
  data?: T;
  message?: string;
}

/** 注文ステータス定義 (ADR-007) */
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

/** チケット券種 (ADR-004) */
export const TICKET_TYPES = {
  GENERAL: '一般',
  STUDENT: '学生',
  SENIOR: 'シニア',
} as const;

export type TicketType = typeof TICKET_TYPES[keyof typeof TICKET_TYPES];

/** ページングデフォルト値 (NFR-PERF-003) */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * 注文番号生成: ORD-YYYYMMDD-XXXXXX
 */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${date}-${rand}`;
}

/**
 * 購入番号生成: TKT-YYYYMMDD-XXXXXX
 */
export function generatePurchaseNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${date}-${rand}`;
}

/**
 * 上映回の販売可否判定 (ADR-003: OQ-002解決)
 * sales_end_at が設定されている場合はそれを優先、未設定時は starts_at を基準とする
 */
export function isScreeningSaleAvailable(screening: {
  startsAt: Date;
  salesStartAt: Date | null;
  salesEndAt: Date | null;
}): boolean {
  const now = new Date();

  if (screening.salesStartAt && now < screening.salesStartAt) return false;

  if (screening.salesEndAt) {
    return now <= screening.salesEndAt;
  }

  // sales_end_at 未設定: 上映開始時刻を過ぎたら購入不可
  return now < screening.startsAt;
}

/**
 * 商品の販売可否判定 (C-DATA-002)
 */
export function isProductSaleAvailable(product: {
  publishStatus: string;
  salesStartAt: Date | null;
  salesEndAt: Date | null;
  stock: number;
}): boolean {
  if (product.publishStatus !== 'published') return false;

  const now = new Date();
  if (product.salesStartAt && now < product.salesStartAt) return false;
  if (product.salesEndAt && now > product.salesEndAt) return false;

  return true;
}
