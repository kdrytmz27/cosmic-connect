import { Router } from 'express';
import { getGroupMessages } from '../controllers/group.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.get('/:sign', authenticate as any, getGroupMessages as any);

export default router;
