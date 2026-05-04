import { Router } from 'express';
import { sendGift } from '../controllers/gift.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.post('/send', authenticate as any, sendGift as any);

export default router;
