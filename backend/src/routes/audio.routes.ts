import { Router } from 'express';
import { uploadVoiceMessage } from '../controllers/audio.controller';
import { authenticate } from '../middlewares/auth.middleware';
import uploadAudio from '../middlewares/audio.middleware';

const router = Router();

// Endpoint for voice message upload
router.post('/upload', authenticate, uploadAudio.single('audio'), uploadVoiceMessage);

export default router;
