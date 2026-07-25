import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// EV ≈ 0.94 (house edge ~6%) - see D:\Cosmic_Connect\parti_tasarim odds math / plan discussion.
// Every non-zero tier adds to expected value, so keeping big multipliers "real" requires
// their probability to be very small - this is the same shape real slot/gacha economies use.
const tiers = [
    { label: 'Kayıp', weightPct: 25.4, multiplier: 0, sortOrder: 1 },
    { label: 'Kısmi iade', weightPct: 60, multiplier: 0.5, sortOrder: 2 },
    { label: 'Küçük kazanç', weightPct: 12.5, multiplier: 2, sortOrder: 3 },
    { label: 'İyi kazanç', weightPct: 2, multiplier: 10, sortOrder: 4 },
    { label: 'Büyük kazanç', weightPct: 0.09, multiplier: 100, sortOrder: 5 },
    { label: 'JACKPOT', weightPct: 0.01, multiplier: 1000, sortOrder: 6 },
];

async function main() {
    const totalWeight = tiers.reduce((sum, t) => sum + t.weightPct, 0);
    if (Math.abs(totalWeight - 100) > 0.001) {
        throw new Error(`Odds tiers must sum to 100, got ${totalWeight}`);
    }

    const ev = tiers.reduce((sum, t) => sum + (t.weightPct / 100) * t.multiplier, 0);
    console.log(`Expected value (EV): ${ev.toFixed(4)}x (house edge: ${((1 - ev) * 100).toFixed(2)}%)`);

    // Wipe and reseed - this table is small and fully owned by this script
    await prisma.luckyGiftOddsTier.deleteMany({});
    for (const tier of tiers) {
        await prisma.luckyGiftOddsTier.create({ data: tier });
        console.log(`✔️  ${tier.label} — %${tier.weightPct} şans, x${tier.multiplier}`);
    }

    console.log(`\n✅ ${tiers.length} oran dilimi kaydedildi.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
