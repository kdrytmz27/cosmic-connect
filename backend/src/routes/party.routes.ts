import { Router } from 'express';
import { getPartyRooms, createPartyRoom, getPartyRoomById, getPartyRoomRanking } from '../controllers/party.controller';
import { getPublicPartyGiftCatalog } from '../controllers/admin.partyGift.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/gifts/catalog', authenticate, getPublicPartyGiftCatalog);
router.get('/', authenticate, getPartyRooms);
router.post('/', authenticate, createPartyRoom);
router.get('/:id', authenticate, getPartyRoomById);
router.get('/:id/ranking', authenticate, getPartyRoomRanking);

export default router;
