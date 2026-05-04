import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const signs = ['KOÇ', 'BOĞA', 'İKİZLER', 'YENGEÇ', 'ASLAN', 'BAŞAK', 'TERAZİ', 'AKREP', 'YAY', 'OĞLAK', 'KOVA', 'BALIK'];
const names = ['Ali', 'Ayşe', 'Burak', 'Cemre', 'Deniz', 'Efe', 'Gizem', 'Hakan', 'Irmak', 'Kaan', 'Leyla', 'Murat', 'Nur', 'Onur', 'Pelin', 'Rüya', 'Sinan', 'Tuğçe', 'Umut', 'Zehra', 'Eylül', 'Batu', 'Güneş', 'Derin', 'Derya'];

async function seed() {
    const passwordHash = await hash('123456', 10);

    console.log('Generating 40 test users...');

    const genders = ['MALE', 'FEMALE', 'NON_BINARY'];
    for (let i = 0; i < 40; i++) {
        const name = names[i % names.length] as string;
        const email = `user${i}@cosmic.com`;
        const sunSign = signs[Math.floor(Math.random() * signs.length)] as string;
        const moonSign = signs[Math.floor(Math.random() * signs.length)] as string;
        const risingSign = signs[Math.floor(Math.random() * signs.length)] as string;
        const gender = genders[Math.floor(Math.random() * genders.length)] as any;

        const randomYear = 1980 + Math.floor(Math.random() * 25); // 1980 to 2004 (age 22 to 46)
        const bDate = new Date(`${randomYear}-05-15`);

        await prisma.user.upsert({
            where: { email },
            update: { gender, birthDate: bDate },
            create: {
                email,
                passwordHash,
                name: name,
                gender: gender,
                bio: `Güneş burcum ${sunSign}, ay ${moonSign}. Yıldız haritasına inanan ruh eşimi arıyorum!`,
                birthDate: bDate,
                birthTime: '12:00',
                latitude: 41.0082,
                longitude: 28.9784,
                sunSign,
                moonSign,
                risingSign,
                stardustBalance: 50,
                role: 'STANDARD'
            }
        });
    }

    console.log('Test users created successfully!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
