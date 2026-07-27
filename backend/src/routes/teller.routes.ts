import { Router } from 'express';
import { listTellers, bookAppointment, claimDailyStardust, playSlot, getSlotState, getPendingFortunes, interpretFortune, getMyFortunes, rateTeller, getTellerProfile, addTellerComment, getTellerComments, uploadFortuneImage, applyTeller, checkApplicationStatus, approveApplication } from '../controllers/teller.controller';
import { createPayoutRequest, getMyPayouts } from '../controllers/payout.controller';
import { authenticate } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';

const router = Router();

router.get('/', authenticate as any, listTellers as any);
router.post('/book', authenticate as any, upload.single('image'), bookAppointment as any);
router.post('/claim', authenticate as any, claimDailyStardust as any);
router.post('/slot', authenticate as any, playSlot as any);
router.get('/slot/state', authenticate as any, getSlotState as any);

router.get('/fortunes/pending', authenticate as any, getPendingFortunes as any);
router.post('/fortunes/interpret', authenticate as any, interpretFortune as any);
router.get('/fortunes/my', authenticate as any, getMyFortunes as any);
router.post('/fortunes/rate', authenticate as any, rateTeller as any);
router.post('/fortune-image', authenticate as any, upload.single('image'), uploadFortuneImage as any);

router.post('/apply', authenticate as any, applyTeller as any);
router.get('/application-status', authenticate as any, checkApplicationStatus as any);
router.post('/approve-application', authenticate as any, approveApplication as any);
router.get('/profile/:id', authenticate as any, getTellerProfile as any);
// Falcı kazancını çekme
router.get('/payout', authenticate as any, getMyPayouts as any);
router.post('/payout', authenticate as any, createPayoutRequest as any);

router.post('/comment', authenticate as any, addTellerComment as any);
router.get('/comments/:id', authenticate as any, getTellerComments as any);

export default router;

