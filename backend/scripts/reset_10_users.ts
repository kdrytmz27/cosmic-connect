import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Veritabanı sıfırlanıyor (madamzoya hariç)...');

    console.log('10 yeni test kullanıcısı oluşturuluyor...');

    // Şifre aynı kalsın (123456)
    const hashedPassword = await bcrypt.hash('123456', 10);

    const signs = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn"
    ];

    for (let i = 1; i <= 10; i++) {
        // user1@example.com, ... user10@example.com
        const email = `user${i}@example.com`;

        await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name: `User ${i}`,
                birthDate: new Date('1995-05-15'),
                birthTime: '12:00',
                latitude: 41.0082,
                longitude: 28.9784,
                sunSign: signs[i - 1] as string, // Herkese farklı burç verelim
                moonSign: 'Aries',
                risingSign: 'Taurus',
                gender: i % 2 === 0 ? 'FEMALE' : 'MALE', // Karışık cinsiyet
                stardustBalance: 500, // Test için biraz yıldız tozu
                isPremium: i <= 2, // İlk 2 kullanıcı premium olsun
                role: 'USER',
                bio: `Merhaba ben User ${i}, evrenin sırlarını keşfetmeye geldim.`
            }
        });
        console.log(`Oluşturuldu: ${email} (Şifre: 123456)`);
    }

    console.log('İşlem başarıyla tamamlandı!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
