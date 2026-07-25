import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SPINS = 100_000;

async function main() {
    const rows = await prisma.luckyGiftOddsTier.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    if (rows.length === 0) {
        console.error('Hiç aktif oran dilimi yok - önce npm run seed:lucky-odds çalıştırın.');
        process.exit(1);
    }

    const totalWeight = rows.reduce((sum, r) => sum + r.weightPct, 0);
    const counts: Record<string, number> = {};
    let totalMultiplier = 0;

    for (let i = 0; i < SPINS; i++) {
        let r = Math.random() * totalWeight;
        for (const tier of rows) {
            if (r < tier.weightPct) {
                counts[tier.label] = (counts[tier.label] || 0) + 1;
                totalMultiplier += tier.multiplier;
                break;
            }
            r -= tier.weightPct;
        }
    }

    const realizedEV = totalMultiplier / SPINS;
    const theoreticalEV = rows.reduce((sum, r) => sum + (r.weightPct / 100) * r.multiplier, 0);

    console.log(`\n${SPINS.toLocaleString('tr-TR')} spin simüle edildi:\n`);
    for (const tier of rows) {
        const hit = counts[tier.label] || 0;
        console.log(`  ${tier.label.padEnd(15)} beklenen: %${tier.weightPct.toString().padStart(6)}  gerçekleşen: %${(hit / SPINS * 100).toFixed(3).padStart(7)}  (${hit} kez)`);
    }
    console.log(`\nTeorik EV:     ${theoreticalEV.toFixed(4)}x`);
    console.log(`Gerçekleşen EV: ${realizedEV.toFixed(4)}x`);
    console.log(realizedEV < 1 ? '\n✅ EV < 1, ekonomi güvenli.' : '\n⚠️  EV >= 1, canlıya almadan önce oranları düzeltin!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
