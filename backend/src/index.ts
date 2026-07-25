import './config/env';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import horoscopeRoutes from './routes/horoscope.routes';
import tellerRoutes from './routes/teller.routes';
import userRoutes from './routes/user.routes';
import premiumRoutes from './routes/premium.routes';
import photoRoutes from './routes/photo.routes';
import audioRoutes from './routes/audio.routes';
import groupRoutes from './routes/group.routes';
import giftRoutes from './routes/gift.routes';
import tarotRoutes from './routes/tarot.routes';
import adminRoutes from './routes/admin.routes';
import questRoutes from './routes/quest.routes';
import familyRoutes from './routes/family.routes';

import { setupSocket } from './controllers/socket.controller';
import { startHoroscopeCron } from './services/horoscope.cron';
import { giftCatalogService } from './services/giftCatalog.service';
import { luckyGiftService } from './services/luckyGift.service';
import { logger } from './utils/logger';

// --- SAFETY NETS (Yakalanmayan Hatalar) ---
process.on('uncaughtException', (err: any) => {
    console.error(`[UNCAUGHT EXCEPTION] ${err.name}: ${err.message}`, err.stack);
    logger.error(`[UNCAUGHT EXCEPTION] ${err.name}: ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (err: any) => {
    console.error(`[UNHANDLED REJECTION] ${err.name}: ${err.message}`, err.stack);
    logger.error(`[UNHANDLED REJECTION] ${err.name}: ${err.message}`, { stack: err.stack });
});
// ------------------------------------------

const app = express();
const httpServer = createServer(app);

// Restrict Socket.io CORS to same whitelist as Express
const allowedOrigins = process.env.NODE_ENV === 'production' ? [
    process.env.FRONTEND_URL, // In case a specific prod mobile proxy/frontend domain is used
    'capacitor://localhost',   // Capacitor iOS
    'http://localhost',        // Capacitor Android
].filter(Boolean) as string[] : [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:3005',
    'capacitor://localhost',
    'http://localhost',
];
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Restrict CORS to specific frontend domains (uses allowedOrigins defined above)
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent large payload DoS
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 500 : 10000, // QA için 10.000 limit
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// VULN 63 FIX: Removed duplicate express.json() call - already defined at line 81 with 10kb limit
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import notificationRoutes from './routes/notification.routes';
import revenuecatRoutes from './routes/revenuecat.routes';
import partyRoutes from './routes/party.routes';

// ... Middleware imports remain correctly configured above

app.use('/api/auth', authRoutes);
app.use('/api/horoscope', horoscopeRoutes);
app.use('/api/teller', tellerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/photo', photoRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/gift', giftRoutes);
app.use('/api/tarot', tarotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/party', partyRoutes);
app.use('/api/family', familyRoutes);

app.use('/api/revenuecat', revenuecatRoutes);

import { globalErrorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './utils/errors';

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

// 404 Catch-All Route (Bilinmeyen Rotalar İçin)
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Bu rota (${req.originalUrl}) sunucuda bulunamadı!`));
});

// Global Error Handler must be the last middleware
app.use(globalErrorHandler);

// Initialize Matchmaking Socket Logic
setupSocket(io);

const PORT = process.env.PORT || 3000;

async function bootstrap() {
    try {
        await prisma.user.updateMany({ data: { isOnline: false } });
        logger.info('Tüm hayalet online profiller çevrimdışına çekildi.');

        await giftCatalogService.initialize();
        logger.info('Parti hediye kataloğu yüklendi.');

        await luckyGiftService.initialize();
        logger.info('Şanslı hediye oran tablosu yüklendi.');

        httpServer.listen(PORT, () => {
            logger.info(`Server listening on port ${PORT}`);
        });
    } catch (err: any) {
        logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
        process.exit(1);
    }
}

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    bootstrap();
    startHoroscopeCron();
}

// Export for testing
export { app, httpServer };
