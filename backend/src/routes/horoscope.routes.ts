import { Router } from 'express';
import { getToday } from '../controllers/horoscope.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/today', authenticate as any, getToday as any);

export default router;
