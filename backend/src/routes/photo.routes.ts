import { Router } from 'express';
import { uploadAvatar, uploadGalleryPhoto, deleteGalleryPhoto, uploadChatPhoto } from '../controllers/photo.controller';
import { authenticate } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';

const router = Router();

// Endpoint for avatar upload (single image)
router.post('/avatar', authenticate, upload.single('image'), uploadAvatar);

// Endpoint for gallery photo upload (single image)
router.post('/gallery', authenticate, upload.single('image'), uploadGalleryPhoto);

// Endpoint to delete a gallery photo by ID
router.delete('/gallery/:id', authenticate, deleteGalleryPhoto);

// Endpoint for chat photo upload (single image)
router.post('/chat', authenticate, upload.single('image'), uploadChatPhoto);

export default router;
