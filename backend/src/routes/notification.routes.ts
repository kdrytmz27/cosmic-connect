import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { registerPushToken, removePushToken } from '../controllers/push.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protected routes (kullanıcı girişi zorunlu)
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread', getUnreadCount);
router.post('/read-all', markAllAsRead);
router.post('/:id/read', markAsRead);

// FEAT-06: Push token kayıt noktaları (Capacitor / Expo)
router.post('/register-token', registerPushToken as any);
router.delete('/register-token', removePushToken as any);

export default router;
