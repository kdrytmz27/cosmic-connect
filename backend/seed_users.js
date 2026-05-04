const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Veritabanı temizleniyor...');

    // Önce ilişkili verileri sil
    await prisma.groupMessage.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.friendship.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.tellerComment.deleteMany({});
    await prisma.tellerApplication.deleteMany({});
    await prisma.gift.deleteMany({});
    await prisma.friendRequest.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.fortuneTeller.deleteMany({});

    // Sonra kullanıcıları sil
    await prisma.user.deleteMany({});

    console.log('✅ Tüm veriler silindi.');
    console.log('🚀 Yeni kullanıcılar oluşturuluyor...');

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('123456', saltRounds);

    // 1 Admin Kullanıcısı
    const admin = await prisma.user.create({
        data: {
            email: 'admin@cosmic.com',
            passwordHash: passwordHash,
            name: 'Admin Zoya',
            role: 'ADMIN',
            bio: 'Sistemin yöneticisi.',
            sunSign: 'SCORPIO',
            moonSign: 'CANCER',
            risingSign: 'PISCES',
            stardustBalance: 10000,
            isPremium: true,
            hobby: 'Astroloji, Yönetim',
            birthDate: new Date('1990-10-31'),
            birthTime: '14:30',
            latitude: 41.0082,
            longitude: 28.9784,
        },
    });
    console.log(`👑 Admin oluşturuldu: ${admin.email}`);

    // 1 Falcı Kullanıcısı (Test için bulunsun)
    const teller = await prisma.user.create({
        data: {
            email: 'falci@cosmic.com',
            passwordHash: passwordHash,
            name: 'Medyum Memiş',
            role: 'FORTUNE_TELLER',
            bio: 'Geleceği gören gözler.',
            sunSign: 'PISCES',
            moonSign: 'SCORPIO',
            risingSign: 'CANCER',
            stardustBalance: 500,
            isPremium: false,
            hobby: 'Tarot, Kahve Falı',
            birthDate: new Date('1985-03-15'),
            birthTime: '12:00',
            latitude: 41.0082,
            longitude: 28.9784,
        },
    });
    console.log(`🔮 Falcı oluşturuldu: ${teller.email}`);

    // 18 Standart Kullanıcı
    const zodiacs = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'];

    let standardUsersCount = 0;
    for (let i = 1; i <= 18; i++) {
        const zodiac = zodiacs[i % zodiacs.length];

        await prisma.user.create({
            data: {
                email: `user${i}@test.com`,
                passwordHash: passwordHash,
                name: `Test Kullanıcı ${i}`,
                role: 'STANDARD',
                bio: `Ben ${i}. test kullanıcısıyım. Burcum ${zodiac}.`,
                sunSign: zodiac,
                moonSign: zodiacs[(i + 1) % zodiacs.length],
                risingSign: zodiacs[(i + 2) % zodiacs.length],
                stardustBalance: Math.floor(Math.random() * 200),
                isPremium: i % 4 === 0,
                hobby: 'Müzik, Astroloji, Spor',
                birthDate: new Date(`2000-0${(i % 9) + 1}-15`),
                birthTime: '10:00',
                latitude: 41.0082 + (Math.random() * 0.1 - 0.05),
                longitude: 28.9784 + (Math.random() * 0.1 - 0.05),
            },
        });
        standardUsersCount++;
    }

    console.log(`👤 ${standardUsersCount} Standart Kullanıcı oluşturuldu.`);
    console.log('🎉 İşlem tamamlandı! Toplam 20 kullanıcı var. Şifreleri: 123456');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
