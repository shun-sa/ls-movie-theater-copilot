import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schema';
import {
  AuthenticationError,
  DuplicateEmailError,
} from '../../shared/errors';
import { JwtPayload } from '../../shared/middleware/auth';

// ADR-006: bcrypt cost factor = 12
const BCRYPT_COST = 12;

export const authService = {
  /**
   * FR-001: 会員登録
   * NFR-SEC-001: パスワードをbcryptでハッシュ化
   */
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new DuplicateEmailError();

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return user;
  },

  /**
   * FR-002: ログイン
   * NFR-SEC-006: 認証失敗時は汎用メッセージ（AuthenticationError）
   */
  async login(input: LoginInput): Promise<string> {
    const user = await authRepository.findByEmail(input.email);

    // ADR-006, NFR-SEC-006: アカウント存在有無を推測させない
    if (!user) throw new AuthenticationError();

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) throw new AuthenticationError();

    return generateToken({ userId: user.id, email: user.email });
  },

  async getMe(userId: string) {
    return authRepository.findById(userId);
  },
};

/**
 * ADR-002: JWT生成
 * プレーンパスワードはログ・レスポンスに含めない
 */
function generateToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '24h';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn } as any);
}
