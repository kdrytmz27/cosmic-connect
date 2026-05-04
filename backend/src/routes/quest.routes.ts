import { Router } from 'express';
import { getQuests, claimQuests } from '../controllers/quest.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/', getQuests as any);
router.post('/claim', claimQuests as any);

export default router;
