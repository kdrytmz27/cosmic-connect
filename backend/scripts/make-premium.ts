import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.user.updateMany({
        data: {
            isPremium: true,
            level: 10,
            stardustBalance: 50000,
            role: 'ADMIN'
        }
    });
    console.log('Tüm kullanıcılar başarıyla Premium, Level 10 ve ADMIN yapıldı. 50.000 Stardust eklendi!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
