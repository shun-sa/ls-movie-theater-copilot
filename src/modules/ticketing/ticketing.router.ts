import { Router } from 'express';
import { ticketingController } from './ticketing.controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

// チケット購入・履歴は認証必須 (C-AUTH-002)
router.use(authenticate);

// FR-009: チケット購入
router.post('/', ticketingController.purchase);

// FR-010: チケット購入履歴
router.get('/', ticketingController.list);
router.get('/:id', ticketingController.findById);

export default router;
