import { z } from 'zod';

// FR-009: チケット購入バリデーション
export const TicketPurchaseSchema = z.object({
  screeningId: z.string().min(1, '上映回は必須です'),
  ticketType: z.enum(['一般', '学生', 'シニア'], {
    errorMap: () => ({ message: '券種を選択してください' }),
  }),
  quantity: z
    .number()
    .int('枚数は整数で入力してください')
    .min(1, '枚数は1以上で入力してください')
    .max(10, '一度に購入できる枚数は10枚までです'),
  paymentMethod: z.enum(['credit_card', 'convenience', 'bank_transfer'], {
    errorMap: () => ({ message: '支払方法を選択してください' }),
  }),
});

export type TicketPurchaseInput = z.infer<typeof TicketPurchaseSchema>;

// 券種別単価 (ADR-004: 初期実装での定義)
export const TICKET_PRICES: Record<string, number> = {
  '一般': 1800,
  '学生': 1200,
  'シニア': 1100,
};
