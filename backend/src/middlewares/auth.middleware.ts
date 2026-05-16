import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../index';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: Invalid token format' }) as any;
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    try {
        const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!dbUser) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }
        if (dbUser.role === 'BANNED') {
            return res.status(403).json({ error: 'Forbidden: Account is banned' });
        }

        // FIX 39: Prevent Stale Token Privilege Escalation! Sync DB role to memory.
        decoded.role = dbUser.role as any;

    } catch (e) {
        return res.status(500).json({ error: 'Internal server error' });
    }

    req.user = decoded;
    next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: No user attached' });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }

    next();
};
