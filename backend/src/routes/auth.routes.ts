import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, setup2FA, verify2FA } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Strict rate limiter for authentication (Prevent Brute-Force / Credential Stuffing)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
});

router.post('/register', authLimiter, register as any);
router.post('/login', authLimiter, login as any);

// 2FA Endpoints
router.post('/2fa/setup', authenticate as any, setup2FA as any);
router.post('/2fa/verify', authenticate as any, verify2FA as any);

export default router;
