"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_USER = exports.TEST_USER_2 = exports.TEST_USER = void 0;
exports.createTestUser = createTestUser;
exports.cleanDatabase = cleanDatabase;
const index_1 = require("../../index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Test user data
exports.TEST_USER = {
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
exports.TEST_USER_2 = {
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
exports.ADMIN_USER = {
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
async function createTestUser(data, role = 'STANDARD', stardust = 1000) {
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    return index_1.prisma.user.create({
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
async function cleanDatabase() {
    // Delete in correct order to respect foreign keys
    await index_1.prisma.tellerComment.deleteMany();
    await index_1.prisma.appointment.deleteMany();
    await index_1.prisma.fortuneTeller.deleteMany();
    await index_1.prisma.tellerApplication.deleteMany();
    await index_1.prisma.report.deleteMany();
    await index_1.prisma.friendRequest.deleteMany();
    await index_1.prisma.gift.deleteMany();
    await index_1.prisma.message.deleteMany();
    await index_1.prisma.groupMessage.deleteMany();
    await index_1.prisma.friendship.deleteMany();
    await index_1.prisma.photo.deleteMany();
    await index_1.prisma.user.deleteMany();
}
//# sourceMappingURL=setup.js.map