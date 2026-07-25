import { Router } from 'express';
import { buyStardust, buyPremium, recordSwipe, unblurProfile, superLike, addExtraTime, devAddStardust } from '../controllers/premium.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/buy-stardust', authenticate as any, buyStardust as any);
router.post('/buy-premium', authenticate as any, buyPremium as any);
router.post('/swipe', authenticate as any, recordSwipe as any);
router.post('/unblur', authenticate as any, unblurProfile as any);
router.post('/super-like', authenticate as any, superLike as any);
router.post('/extra-time', authenticate as any, addExtraTime as any);

// TEST ONLY - see devAddStardust in premium.controller.ts for removal notes.
router.post('/dev-add-stardust', authenticate as any, devAddStardust as any);

export default router;
