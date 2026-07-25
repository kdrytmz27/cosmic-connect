import { prisma } from '../index';
import { logger } from '../utils/logger';

interface OddsTier {
    label: string;
    weightPct: number;
    multiplier: number;
}

export interface LuckyRollResult {
    label: string;
    multiplier: number;
}

const REFRESH_INTERVAL_MS = 60_000;

class LuckyGiftService {
    private tiers: OddsTier[] = [];

    public async initialize() {
        await this.refresh();
        setInterval(() => {
            this.refresh().catch(e => logger.error('Lucky gift odds refresh error:', e));
        }, REFRESH_INTERVAL_MS);
    }

    public async refresh() {
        const rows = await prisma.luckyGiftOddsTier.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        this.tiers = rows.map(r => ({ label: r.label, weightPct: r.weightPct, multiplier: r.multiplier }));
    }

    // Fail-safe, not fail-open: if odds are misconfigured/unloaded, always resolve to a miss
    // rather than risk minting free stardust.
    public roll(): LuckyRollResult {
        if (this.tiers.length === 0) {
            return { label: 'unavailable', multiplier: 0 };
        }
        const totalWeight = this.tiers.reduce((sum, t) => sum + t.weightPct, 0);
        let r = Math.random() * totalWeight;
        for (const tier of this.tiers) {
            if (r < tier.weightPct) return { label: tier.label, multiplier: tier.multiplier };
            r -= tier.weightPct;
        }
        return { label: 'miss', multiplier: 0 };
    }
}

export const luckyGiftService = new LuckyGiftService();
