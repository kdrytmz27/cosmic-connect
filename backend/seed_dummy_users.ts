import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const rawPassword = '0212302321';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    console.log(`Birlikte 15 test hesabı şifre ile ekleniyor...`);

    for (let i = 1; i <= 15; i++) {
        const email = `user${i}@cosmic.com`;
        const name = `Test User ${i}`;

        await prisma.user.upsert({
            where: { email },
            update: { passwordHash },
            create: {
                email,
                passwordHash,
                name: name,
                birthDate: new Date('1990-01-01'),
                birthTime: '12:00',
                latitude: 41.0082,
                longitude: 28.9784,
                sunSign: 'Aries',
                moonSign: 'Taurus',
                risingSign: 'Gemini',
                gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
                interestedIn: i % 2 === 0 ? 'FEMALE' : 'MALE',
                stardustBalance: 500, // Test edilmesi için biraz stardust verelim
                role: 'STANDARD'
            }
        });
        console.log(`✔️ ${email} eklendi veya güncellendi.`);
    }

    console.log('\n✅ 15 test kullanıcısı başarıyla eklendi!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
