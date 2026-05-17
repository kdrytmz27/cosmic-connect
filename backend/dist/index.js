"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const horoscope_routes_1 = __importDefault(require("./routes/horoscope.routes"));
const teller_routes_1 = __importDefault(require("./routes/teller.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const premium_routes_1 = __importDefault(require("./routes/premium.routes"));
const photo_routes_1 = __importDefault(require("./routes/photo.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const gift_routes_1 = __importDefault(require("./routes/gift.routes"));
const tarot_routes_1 = __importDefault(require("./routes/tarot.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const quest_routes_1 = __importDefault(require("./routes/quest.routes"));
const socket_controller_1 = require("./controllers/socket.controller");
const horoscope_cron_1 = require("./services/horoscope.cron");
dotenv_1.default.config();
const logger_1 = require("./utils/logger");
// --- SAFETY NETS (Yakalanmayan Hatalar) ---
process.on('uncaughtException', (err) => {
    console.error(`[UNCAUGHT EXCEPTION] Sunucu kapanıyor! ${err.name}: ${err.message}`, err.stack);
    logger_1.logger.error(`[UNCAUGHT EXCEPTION] Sunucu kapanıyor! ${err.name}: ${err.message}`, { stack: err.stack });
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error(`[UNHANDLED REJECTION] Sunucu kapanıyor! ${err.name}: ${err.message}`, err.stack);
    logger_1.logger.error(`[UNHANDLED REJECTION] Sunucu kapanıyor! ${err.name}: ${err.message}`, { stack: err.stack });
    process.exit(1);
});
// ------------------------------------------
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Restrict Socket.io CORS to same whitelist as Express
const allowedOrigins = process.env.NODE_ENV === 'production' ? [
    process.env.FRONTEND_URL, // In case a specific prod mobile proxy/frontend domain is used
    'capacitor://localhost', // Capacitor iOS
    'http://localhost', // Capacitor Android
].filter(Boolean) : [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'capacitor://localhost',
    'http://localhost',
];
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
exports.prisma = new client_1.PrismaClient();
// Restrict CORS to specific frontend domains (uses allowedOrigins defined above)
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express_1.default.json({ limit: '10kb' })); // Limit body size to prevent large payload DoS
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
// VULN 63 FIX: Removed duplicate express.json() call - already defined at line 81 with 10kb limit
const path_1 = __importDefault(require("path"));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const revenuecat_routes_1 = __importDefault(require("./routes/revenuecat.routes"));
// ... Middleware imports remain correctly configured above
app.use('/api/auth', auth_routes_1.default);
app.use('/api/horoscope', horoscope_routes_1.default);
app.use('/api/teller', teller_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/premium', premium_routes_1.default);
app.use('/api/photo', photo_routes_1.default);
app.use('/api/group', group_routes_1.default);
app.use('/api/gift', gift_routes_1.default);
app.use('/api/tarot', tarot_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/notification', notification_routes_1.default);
app.use('/api/quests', quest_routes_1.default);
app.use('/api/revenuecat', revenuecat_routes_1.default);
const errorHandler_1 = require("./middlewares/errorHandler");
const errors_1 = require("./utils/errors");
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// 404 Catch-All Route (Bilinmeyen Rotalar İçin)
app.use((req, res, next) => {
    next(new errors_1.NotFoundError(`Bu rota (${req.originalUrl}) sunucuda bulunamadı!`));
});
// Global Error Handler must be the last middleware
app.use(errorHandler_1.globalErrorHandler);
// Initialize Matchmaking Socket Logic
(0, socket_controller_1.setupSocket)(io);
const PORT = process.env.PORT || 3000;
async function bootstrap() {
    try {
        await exports.prisma.user.updateMany({ data: { isOnline: false } });
        logger_1.logger.info('Tüm hayalet online profiller çevrimdışına çekildi.');
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`Server listening on port ${PORT}`);
        });
    }
    catch (err) {
        logger_1.logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
        process.exit(1);
    }
}
// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    bootstrap();
    (0, horoscope_cron_1.startHoroscopeCron)();
}
//# sourceMappingURL=index.js.map