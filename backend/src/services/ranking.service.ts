import { prisma } from '../index';

type Window = 'daily' | 'weekly';

interface CacheEntry {
    data: RankingEntry[];
    expiresAt: number;
}

export interface RankingEntry {
    rank: number;
    userId: string;
    name: string;
    avatar: string | null;
    totalReceived: number;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

function getWindowStart(window: Window): Date {
    const now = new Date();
    if (window === 'daily') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return start;
    }
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
}

class RankingService {
    async getRoomRanking(roomId: string, window: Window = 'daily'): Promise<RankingEntry[]> {
        const cacheKey = `room:${roomId}:${window}`;
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) return cached.data;

        const since = getWindowStart(window);
        const rows = await prisma.gift.groupBy({
            by: ['receiverId'],
            where: { roomId, createdAt: { gte: since } },
            _sum: { stardustCost: true },
            orderBy: { _sum: { stardustCost: 'desc' } },
            take: 20
        });

        const users = await prisma.user.findMany({
            where: { id: { in: rows.map(r => r.receiverId) } },
            select: { id: true, name: true, avatar: true }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const data: RankingEntry[] = rows.map((r, i) => ({
            rank: i + 1,
            userId: r.receiverId,
            name: userMap.get(r.receiverId)?.name || 'Kozmik Gezgin',
            avatar: userMap.get(r.receiverId)?.avatar || null,
            totalReceived: r._sum.stardustCost || 0
        }));

        cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
        return data;
    }
}

export const rankingService = new RankingService();
