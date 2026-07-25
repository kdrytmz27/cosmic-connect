import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const sunSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const moonSigns = ['Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries'];
const risingSigns = ['Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus'];
const names = [
    'Ayşe Kaya', 'Mehmet Demir', 'Zeynep Yıldız', 'Ali Şahin', 'Fatma Çelik',
    'Ahmet Arslan', 'Elif Aydın', 'Mustafa Öztürk', 'Selin Doğan', 'Emre Yılmaz',
    'Büşra Kılıç', 'Serkan Özdemir', 'Merve Aslan', 'Enes Kurt', 'Duygu Polat',
    'Kerem Yıldırım', 'Nisa Güneş', 'Taha Avcı', 'Ceren Koç', 'Baran Bulut',
    'Hüseyin Çetin', 'Seda Akın', 'Berkay Şimşek', 'Tuğba Keskin', 'Oğuz Çakır',
    'Rabia Ertürk', 'Furkan Güler', 'Arzu Yıldız', 'Cem Kara', 'Hatice Öz'
];

async function main() {
    const rawPassword = '0212302321';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    console.log(`30 test kullanıcısı ekleniyor (şifre: ${rawPassword})...`);

    for (let i = 1; i <= 30; i++) {
        const email = `user${i}@cosmic.com`;
        const name = names[i - 1];
        const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
        const year = 1990 + (i % 12);
        const month = ((i - 1) % 12) + 1;
        const day = ((i * 3 - 1) % 28) + 1;
        const birthDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

        await prisma.user.upsert({
            where: { email },
            update: { passwordHash, name },
            create: {
                email,
                passwordHash,
                name,
                birthDate,
                birthTime: `${String(8 + (i % 12)).padStart(2, '0')}:00`,
                latitude: 41.0082 + (i * 0.01),
                longitude: 28.9784 + (i * 0.01),
                sunSign: sunSigns[i % 12],
                moonSign: moonSigns[i % 12],
                risingSign: risingSigns[i % 12],
                gender,
                interestedIn: gender === 'MALE' ? 'FEMALE' : 'MALE',
                stardustBalance: 500,
                role: 'STANDARD'
            }
        });
        console.log(`✔️  ${email} — ${name} eklendi.`);
    }

    console.log('\n✅ 30 test kullanıcısı başarıyla eklendi!');
    console.log('Şifre: 0212302321');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
