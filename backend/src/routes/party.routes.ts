import { Router } from 'express';
import { getPartyRooms, createPartyRoom, getPartyRoomById } from '../controllers/party.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getPartyRooms);
router.post('/', authenticate, createPartyRoom);
router.get('/:id', authenticate, getPartyRoomById);

export default router;
