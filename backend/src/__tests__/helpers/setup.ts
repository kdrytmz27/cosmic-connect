import { prisma } from '../../index';
import bcrypt from 'bcryptjs';

// Test user data
export const TEST_USER = {
    email: 'test@cosmic.com',
    password: 'TestPass123',
    name: 'Test User',
    birthDate: '1995-06-15',
    birthTime: '14:30',
    latitude: 41.0082,
    longitude: 28.9784,
    sunSign: 'Gemini',
    moonSign: 'Aries',
    risingSign: 'Leo',
    gender: 'MALE',
    interestedIn: 'FEMALE'
};

export const TEST_USER_2 = {
    email: 'test2@cosmic.com',
    password: 'TestPass456',
    name: 'Test User 2',
    birthDate: '1993-03-20',
    birthTime: '10:00',
    latitude: 41.0082,
    longitude: 28.9784,
    sunSign: 'Pisces',
    moonSign: 'Cancer',
    risingSign: 'Scorpio',
    gender: 'FEMALE',
    interestedIn: 'MALE'
};

export const ADMIN_USER = {
    email: 'admin@cosmic.com',
    password: 'AdminPass123',
    name: 'Admin User',
    birthDate: '1990-01-01',
    birthTime: '00:00',
    latitude: 41.0082,
    longitude: 28.9784,
    sunSign: 'Capricorn',
    moonSign: 'Taurus',
    risingSign: 'Virgo',
    gender: 'MALE',
    interestedIn: 'FEMALE'
};

export async function createTestUser(data: typeof TEST_USER, role: string = 'STANDARD', stardust: number = 1000) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            name: data.name,
            birthDate: new Date(data.birthDate),
            birthTime: data.birthTime,
            latitude: data.latitude,
            longitude: data.longitude,
            sunSign: data.sunSign,
            moonSign: data.moonSign,
            risingSign: data.risingSign,
            gender: data.gender,
            interestedIn: data.interestedIn,
            role,
            stardustBalance: stardust,
            matchScore: 100,
            dailyMatchPasses: 50
        }
    });
}

export async function cleanDatabase() {
    // Delete in correct order to respect foreign keys
    await prisma.tellerComment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.fortuneTeller.deleteMany();
    await prisma.tellerApplication.deleteMany();
    await prisma.report.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.gift.deleteMany();
    await prisma.message.deleteMany();
    await prisma.groupMessage.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.user.deleteMany();
}
