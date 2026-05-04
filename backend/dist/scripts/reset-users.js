"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];
async function main() {
    // SECURITY: Never allow this destructive script to run in production
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ FATAL: reset-users.ts cannot run in production! Aborting.');
        process.exit(1);
    }
    console.log('Cleaning up database...');
    // Delete related records first due to lack of CASCADE
    await prisma.message.deleteMany();
    await prisma.groupMessage.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.tellerComment.deleteMany();
    await prisma.gift.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.tellerApplication.deleteMany();
    await prisma.fortuneTeller.deleteMany();
    // Finally delete users
    await prisma.user.deleteMany();
    console.log('Database cleared. Generating 50 new users...');
    const saltRounds = 10;
    const passwordHash = await bcryptjs_1.default.hash('123456', saltRounds);
    const usersToCreate = [];
    for (let i = 1; i <= 50; i++) {
        const sign = ZODIAC_SIGNS[i % 12];
        const randomGender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
        const randomInterest = randomGender === 'MALE' ? 'FEMALE' : 'MALE';
        usersToCreate.push({
            email: `user${i}@cosmic.com`,
            passwordHash,
            name: `User ${i}`,
            bio: `This is a generated bio for User ${i}. I'm a proud ${sign}!`,
            gender: randomGender,
            interestedIn: randomInterest,
            birthDate: new Date(1990 + (i % 10), (i % 12), (i % 28) + 1), // Pseudo-random birthdate
            birthTime: '12:00',
            latitude: 41.0082, // Istanbul
            longitude: 28.9784, // Istanbul
            sunSign: sign || 'Aries',
            moonSign: ZODIAC_SIGNS[(i + 2) % 12] || 'Aries',
            risingSign: ZODIAC_SIGNS[(i + 4) % 12] || 'Aries',
            stardustBalance: 1000,
            matchScore: 100,
            dailySwipes: 20,
        });
    }
    await prisma.user.createMany({
        data: usersToCreate
    });
    console.log(`Successfully created ${usersToCreate.length} users! (user1@cosmic.com to user50@cosmic.com | Pass: 123456)`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reset-users.js.map