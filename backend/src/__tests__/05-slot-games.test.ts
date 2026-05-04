process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

import request from 'supertest';
import { app, prisma } from '../index';
import { TEST_USER, createTestUser, cleanDatabase } from './helpers/setup';
import { slotManager } from '../services/slot.service';

let u1Token: string;
let u1Id: string;

beforeAll(async () => {
    await cleanDatabase();

    const u1 = await createTestUser(TEST_USER, 'STANDARD', 500);
    u1Id = u1.id;

    const r1 = await request(app).post('/api/auth/login').send({ email: TEST_USER.email, password: TEST_USER.password });
    u1Token = r1.body.token;
});

afterAll(async () => {
    slotManager.stopLoop();
    await cleanDatabase();
    await prisma.$disconnect();
});

// ──────────────────────────────────────────────────────────────
// 🎰 Slot Makinesi Testleri
// ──────────────────────────────────────────────────────────────
describe('🎰 Slot Durum Sorgulama', () => {
    test('GET /api/teller/slot/state temel state bilgisi dönmeli', async () => {
        const res = await request(app).get('/api/teller/slot/state').set('Authorization', `Bearer ${u1Token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('state');
        expect(res.body).toHaveProperty('timeLeft');
        expect(['BETTING', 'ROLLING', 'RESULT']).toContain(res.body.state);
        expect(typeof res.body.timeLeft).toBe('number');
    });
});

describe('🛡️ Slot Güvenlik Kontrolleri', () => {
    test('betType olmadan bahis atılamaz (400)', async () => {
        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: 50 });
        expect(res.status).toBe(400);
    });

    test('Negatif bahis miktarı reddedilmeli', async () => {
        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: -10, betType: 'BIG' });
        expect(res.status).toBe(400);
    });

    test('Sıfır bahis miktarı reddedilmeli', async () => {
        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: 0, betType: 'BIG' });
        expect(res.status).toBe(400);
    });

    test('1000 üstü bahis reddedilmeli', async () => {
        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: 5000, betType: 'SMALL' });
        expect(res.status).toBe(400);
    });

    test('Ondalıklı (float) bahis miktarı reddedilmeli', async () => {
        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: 10.5, betType: 'BIG' });
        expect(res.status).toBe(400);
    });

    test('Yetersiz bakiye ile bahis atılamaz', async () => {
        // Bakiyeyi 0 yap
        await prisma.user.update({ where: { id: u1Id }, data: { stardustBalance: 0 } });

        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: 10, betType: 'BIG' });
        expect(res.status).toBe(400);

        // Bakiyeyi geri al
        await prisma.user.update({ where: { id: u1Id }, data: { stardustBalance: 500 } });
    });
});

describe('🎲 Slot Bahis Akışı', () => {
    test('Geçerli bahis kabul edilmeli ve bakiye düşmeli', async () => {
        // slotManager state'ini BETTING'e zorla
        (slotManager as any).state = 'BETTING';
        (slotManager as any).timeLeft = 20;
        (slotManager as any).bets = [];

        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: 50, betType: 'BIG' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.newBalance).toBe(450); // 500 - 50

        // Bakiye DB'de de doğrula
        const user = await prisma.user.findUnique({ where: { id: u1Id } });
        expect(user!.stardustBalance).toBe(450);
    });

    test('Aynı turda iki kez bahis atılamaz', async () => {
        // Önceki testten bets array'ine zaten bir bahis ekli
        const res = await request(app).post('/api/teller/slot').set('Authorization', `Bearer ${u1Token}`)
            .send({ betAmount: 10, betType: 'SMALL' });
        expect(res.status).toBe(400);
    });

    test('Bahis sonrası state da myBet bilgisi gelmeli', async () => {
        const res = await request(app).get('/api/teller/slot/state').set('Authorization', `Bearer ${u1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.myBet).not.toBeNull();
        expect(res.body.myBet.amount).toBe(50);
        expect(res.body.myBet.type).toBe('BIG');
    });
});
