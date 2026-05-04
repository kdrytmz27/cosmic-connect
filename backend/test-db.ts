import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Database connected. Found users:', users.length);
        if (users.length > 0) {
            console.log('Sample user email:', users[0]?.email);
            console.log('Sample user role:', users[0]?.role);
        }
        const templates = await prisma.horoscopeTemplate.count();
        console.log('Horoscope templates count:', templates);
    } catch (e) {
        console.error('Database connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
