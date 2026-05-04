"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.horoscopeService = void 0;
const index_1 = require("../index");
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
// In-memory cache for horoscope templates
// Key format: "sign-category" → value: template content array
let templateCache = new Map();
let cacheLoadedAt = null;
// Cache TTL: refresh if loaded before today (midnight reset)
function isCacheStale() {
    if (!cacheLoadedAt)
        return true;
    const now = new Date();
    return now.toDateString() !== cacheLoadedAt.toDateString();
}
async function ensureCacheLoaded() {
    if (!isCacheStale() && templateCache.size > 0)
        return;
    const allTemplates = await index_1.prisma.horoscopeTemplate.findMany({
        orderBy: { id: 'asc' }
    });
    const newCache = new Map();
    for (const t of allTemplates) {
        const key = `${t.sign}-${t.category}`;
        if (!newCache.has(key)) {
            newCache.set(key, []);
        }
        newCache.get(key).push({ content: t.content });
    }
    templateCache = newCache;
    cacheLoadedAt = new Date();
    logger_1.logger.info(`[HoroscopeCache] Loaded ${allTemplates.length} templates into cache (${newCache.size} groups)`);
}
exports.horoscopeService = {
    async getDailyHoroscope(userId, dateStr, sign, category) {
        // Load cache on first call, then serve from memory
        await ensureCacheLoaded();
        const key = `${sign}-${category}`;
        const templates = templateCache.get(key);
        if (!templates || templates.length === 0) {
            return 'Bugün için özel bir yorum bulunamadı. Yıldızlar sessiz...';
        }
        // Deterministic template selection based on user+date+category hash
        const hashInput = `${userId}-${dateStr}-${category}`;
        const hash = crypto_1.default.createHash('md5').update(hashInput).digest('hex');
        const numericHash = parseInt(hash.substring(0, 8), 16);
        const index = numericHash % templates.length;
        return templates[index]?.content || 'Yıldızlardan henüz bir mesaj gelmedi...';
    },
    // Manual cache invalidation (e.g., after admin adds new templates)
    invalidateCache() {
        templateCache.clear();
        cacheLoadedAt = null;
        logger_1.logger.info('[HoroscopeCache] Cache invalidated');
    }
};
//# sourceMappingURL=horoscope.service.js.map