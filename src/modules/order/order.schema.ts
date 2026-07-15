import { z } from 'zod';

// FR-008: 商品注文バリデーション
export const OrderSchema = z.object({
  shippingName: z.string().min(1, '氏名は必須です').max(100, '氏名は100文字以内で入力してください'),
  postalCode: z
    .string()
    .regex(/^\d{3}-?\d{4}$/, '郵便番号の形式が正しくありません（例: 123-4567）'),
  prefecture: z.string().min(1, '都道府県は必須です').max(20),
  addressLine: z.string().min(1, '市区町村・番地は必須です').max(200),
  phoneNumber: z
    .string()
    .regex(/^0\d{9,10}$/, '電話番号の形式が正しくありません（例: 09012345678）'),
  paymentMethod: z.enum(['credit_card', 'convenience', 'bank_transfer'], {
    errorMap: () => ({ message: '支払方法を選択してください' }),
  }),
});

export type OrderInput = z.infer<typeof OrderSchema>;

// FR-006: カート追加バリデーション
export const AddToCartSchema = z.object({
  productId: z.string().min(1, '商品IDは必須です'),
  quantity: z
    .number()
    .int('数量は整数で入力してください')
    .min(1, '数量は1以上で入力してください'),
});

// FR-007: カート数量変更バリデーション
export const UpdateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('数量は整数で入力してください')
    .min(0, '数量は0以上で入力してください'),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
