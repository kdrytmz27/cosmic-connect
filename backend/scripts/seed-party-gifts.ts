import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const gifts = [
    // BASLANGIC (1-100)
    { giftKey: 'heart', name: 'Kalp', icon: '❤️', price: 5, category: 'BASLANGIC', animationTier: 'TOAST', sortOrder: 1 },
    { giftKey: 'rose', name: 'Gül', icon: '🌹', price: 10, category: 'BASLANGIC', animationTier: 'TOAST', sortOrder: 2 },
    { giftKey: 'flower', name: 'Çiçek', icon: '💐', price: 25, category: 'BASLANGIC', animationTier: 'TOAST', sortOrder: 3 },
    { giftKey: 'lucky_star', name: 'Şanslı Yıldız', icon: '⭐', price: 30, category: 'BASLANGIC', animationTier: 'TOAST', isLuckyEligible: true, sortOrder: 4 },
    { giftKey: 'kiss', name: 'Öpücük', icon: '💋', price: 50, category: 'BASLANGIC', animationTier: 'TOAST', sortOrder: 5 },
    { giftKey: 'teddy', name: 'Ayıcık', icon: '🧸', price: 80, category: 'BASLANGIC', animationTier: 'TOAST', sortOrder: 6 },

    // ORTA (100-999)
    { giftKey: 'crown', name: 'Taç', icon: '👑', price: 100, category: 'ORTA', animationTier: 'TOAST', sortOrder: 7 },
    { giftKey: 'perfume', name: 'Parfüm', icon: '🧴', price: 150, category: 'ORTA', animationTier: 'TOAST', sortOrder: 8 },
    { giftKey: 'lucky_box', name: 'Şanslı Kutu', icon: '🎁', price: 200, category: 'ORTA', animationTier: 'TOAST', isLuckyEligible: true, sortOrder: 9 },
    { giftKey: 'firework', name: 'Havai Fişek', icon: '🎆', price: 300, category: 'ORTA', animationTier: 'FULLSCREEN', animationUrl: '/lottie/firework.json', sortOrder: 10 },
    { giftKey: 'car', name: 'Spor Araba', icon: '🏎️', price: 500, category: 'ORTA', animationTier: 'FULLSCREEN', animationUrl: '/lottie/car.json', sortOrder: 11 },
    { giftKey: 'ring', name: 'Yüzük', icon: '💍', price: 600, category: 'ORTA', animationTier: 'FULLSCREEN', animationUrl: '/lottie/ring.json', sortOrder: 12 },

    // PREMIUM (1000+)
    { giftKey: 'lucky_diamond', name: 'Şanslı Elmas', icon: '💎', price: 1000, category: 'PREMIUM', animationTier: 'FULLSCREEN', animationUrl: '/lottie/lucky_diamond.json', isLuckyEligible: true, sortOrder: 13 },
    { giftKey: 'yacht', name: 'Yat', icon: '🛥️', price: 3000, category: 'PREMIUM', animationTier: 'FULLSCREEN', animationUrl: '/lottie/yacht.json', sortOrder: 14 },
    { giftKey: 'castle', name: 'Kozmik Şato', icon: '🏰', price: 5000, category: 'PREMIUM', animationTier: 'FULLSCREEN', animationUrl: '/lottie/castle.json', sortOrder: 15 },
    { giftKey: 'jet', name: 'Özel Jet', icon: '✈️', price: 8000, category: 'PREMIUM', animationTier: 'FULLSCREEN', animationUrl: '/lottie/jet.json', sortOrder: 16 },

    // LUKS (10000+)
    { giftKey: 'dragon', name: 'Ejderha', icon: '🐉', price: 10000, category: 'LUKS', animationTier: 'FULLSCREEN', animationUrl: '/lottie/dragon.json', sortOrder: 17 },
    { giftKey: 'lucky_galaxy', name: 'Şanslı Galaksi', icon: '🌌', price: 12000, category: 'LUKS', animationTier: 'FULLSCREEN', animationUrl: '/lottie/lucky_galaxy.json', isLuckyEligible: true, sortOrder: 18 },
    { giftKey: 'carriage', name: 'Aşk Arabası', icon: '🎠', price: 20000, category: 'LUKS', animationTier: 'FULLSCREEN', animationUrl: '/lottie/carriage.json', sortOrder: 19 },
];

async function main() {
    for (const gift of gifts) {
        await prisma.partyGift.upsert({
            where: { giftKey: gift.giftKey },
            update: gift,
            create: gift
        });
        console.log(`✔️  ${gift.giftKey} — ${gift.name} (${gift.price} stardust)`);
    }
    console.log(`\n✅ ${gifts.length} hediye kataloğa eklendi/güncellendi.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
