import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function makeAdmin() {
    try {
        const hash = await bcrypt.hash('123456', 10);
        await prisma.user.create({
            data: {
                email: 'admin@cosmic.com',
                name: 'Zoya Admin',
                passwordHash: hash,
                role: 'ADMIN',
                bio: 'Admin',
                birthDate: new Date('1990-01-01'),
                birthTime: '12:00',
                sunSign: 'ARIES',
                moonSign: 'ARIES',
                risingSign: 'ARIES',
                latitude: 0,
                longitude: 0
            }
        });
        console.log('Admin account created: admin@cosmic.com / 123456');
    } catch (e: any) {
        if (e.code === 'P2002') {
            console.log('Admin account already exists.');
        } else {
            console.log('Error:', e.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
