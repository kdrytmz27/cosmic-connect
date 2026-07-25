import { prisma } from '../index';
import { logger } from '../utils/logger';
import { PARTY_GIFTS } from '../config/gifts';

export interface PartyGiftData {
    giftKey: string;
    name: string;
    icon: string | null;
    price: number;
    category: string;
    animationUrl: string | null;
    animationTier: string;
    isLuckyEligible: boolean;
    sortOrder: number;
}

const REFRESH_INTERVAL_MS = 60_000;

class GiftCatalogService {
    private catalog = new Map<string, PartyGiftData>();

    public async initialize() {
        await this.refresh();
        setInterval(() => {
            this.refresh().catch(e => logger.error('Gift catalog refresh error:', e));
        }, REFRESH_INTERVAL_MS);
    }

    public async refresh() {
        const rows = await prisma.partyGift.findMany({ where: { isActive: true } });

        if (rows.length === 0) {
            // Defensive fallback if the DB catalog is empty (e.g. seed never ran)
            this.catalog.clear();
            for (const [giftKey, g] of Object.entries(PARTY_GIFTS)) {
                this.catalog.set(giftKey, {
                    giftKey, name: g.name, icon: null, price: g.price,
                    category: 'ORTA', animationUrl: null, animationTier: 'TOAST',
                    isLuckyEligible: false, sortOrder: 0
                });
            }
            return;
        }

        const next = new Map<string, PartyGiftData>();
        for (const row of rows) {
            next.set(row.giftKey, {
                giftKey: row.giftKey,
                name: row.name,
                icon: row.icon,
                price: row.price,
                category: row.category,
                animationUrl: row.animationUrl,
                animationTier: row.animationTier,
                isLuckyEligible: row.isLuckyEligible,
                sortOrder: row.sortOrder
            });
        }
        this.catalog = next;
    }

    public getGift(giftKey: string): PartyGiftData | undefined {
        return this.catalog.get(giftKey);
    }

    public getAllActive(): PartyGiftData[] {
        return Array.from(this.catalog.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    }
}

export const giftCatalogService = new GiftCatalogService();
