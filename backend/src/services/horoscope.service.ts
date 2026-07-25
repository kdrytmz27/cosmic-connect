import { prisma } from '../index';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// In-memory cache for horoscope templates
// Key format: "sign-category" → value: template content array
let templateCache: Map<string, { content: string }[]> = new Map();
let cacheLoadedAt: Date | null = null;

// Cache TTL: refresh if loaded before today (midnight reset)
function isCacheStale(): boolean {
    if (!cacheLoadedAt) return true;
    const now = new Date();
    return now.toDateString() !== cacheLoadedAt.toDateString();
}

let cachePromise: Promise<void> | null = null;

async function ensureCacheLoaded(): Promise<void> {
    if (!isCacheStale() && templateCache.size > 0) return;

    if (!cachePromise) {
        cachePromise = (async () => {
            try {
                const allTemplates = await prisma.horoscopeTemplate.findMany({
                    orderBy: { id: 'asc' }
                });

                const newCache = new Map<string, { content: string }[]>();
                for (const t of allTemplates) {
                    const key = `${t.sign}-${t.category}`;
                    if (!newCache.has(key)) {
                        newCache.set(key, []);
                    }
                    newCache.get(key)!.push({ content: t.content });
                }

                templateCache = newCache;
                cacheLoadedAt = new Date();
                logger.info(`[HoroscopeCache] Loaded ${allTemplates.length} templates into cache (${newCache.size} groups)`);
            } finally {
                cachePromise = null;
            }
        })();
    }
    
    return cachePromise;
}

export const horoscopeService = {
    async getDailyHoroscope(userId: string, dateStr: string, sign: string, category: 'LOVE' | 'CAREER' | 'HEALTH') {
        // Load cache on first call, then serve from memory
        await ensureCacheLoaded();

        const key = `${sign}-${category}`;
        const templates = templateCache.get(key);

        if (!templates || templates.length === 0) {
            return 'Bugün için özel bir yorum bulunamadı. Yıldızlar sessiz...';
        }

        // Deterministic template selection based on user+date+category hash
        const hashInput = `${userId}-${dateStr}-${category}`;
        const hash = crypto.createHash('md5').update(hashInput).digest('hex');
        const numericHash = parseInt(hash.substring(0, 8), 16);
        const index = numericHash % templates.length;

        return templates[index]?.content || 'Yıldızlardan henüz bir mesaj gelmedi...';
    },

    // Manual cache invalidation (e.g., after admin adds new templates)
    invalidateCache() {
        templateCache.clear();
        cacheLoadedAt = null;
        logger.info('[HoroscopeCache] Cache invalidated');
    }
};
