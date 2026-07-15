import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

// FR-001: 会員登録
router.post('/register', authController.register);

// FR-002: ログイン
router.post('/login', authController.login);

// ログアウト
router.post('/logout', authController.logout);

// ログインユーザー情報取得 (C-AUTH-002)
router.get('/me', authenticate, authController.me);

export default router;
