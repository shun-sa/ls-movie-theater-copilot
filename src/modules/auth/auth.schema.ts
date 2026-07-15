import { z } from 'zod';

// FR-001: 会員登録バリデーション
export const RegisterSchema = z
  .object({
    name: z.string().min(1, '氏名は必須です').max(50, '氏名は50文字以内で入力してください'),
    email: z
      .string()
      .email('メールアドレスの形式が正しくありません')
      .max(255, 'メールアドレスは255文字以内で入力してください'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .max(64, 'パスワードは64文字以内で入力してください')
      .regex(/^[a-zA-Z0-9]+$/, 'パスワードは英数字で入力してください'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'パスワードが一致しません',
    path: ['passwordConfirm'],
  });

// FR-002: ログインバリデーション
export const LoginSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードは必須です'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
