import { Router } from 'express';
import { getDailyTarotStatus, drawDailyTarot } from '../controllers/tarot.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/daily/status', authenticate as any, getDailyTarotStatus);
router.post('/daily/draw', authenticate as any, drawDailyTarot);

export default router;
