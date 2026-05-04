process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

import request from 'supertest';
import { app, prisma } from '../index';
import { TEST_USER, TEST_USER_2, ADMIN_USER, createTestUser, cleanDatabase } from './helpers/setup';
import { slotManager } from '../services/slot.service';

let u1Token: string;
let u2Token: string;
let adminToken: string;
let u1Id: string;
let u2Id: string;
let adminId: string;
let applicationId: string;
let appointmentId: string;
let tellerProfileId: string; // FortuneTeller tablosundaki gerçek ID

beforeAll(async () => {
    await cleanDatabase();

    // Create Base Users
    const u1 = await createTestUser(TEST_USER, 'STANDARD', 500);
    const u2 = await createTestUser(TEST_USER_2, 'STANDARD', 200);
    const admin = await createTestUser(ADMIN_USER, 'ADMIN', 1000);

    u1Id = u1.id;
    u2Id = u2.id;
    adminId = admin.id;

    // Login to get tokens
    const r1 = await request(app).post('/api/auth/login').send({ email: TEST_USER.email, password: TEST_USER.password });
    u1Token = r1.body.token;

    const r2 = await request(app).post('/api/auth/login').send({ email: TEST_USER_2.email, password: TEST_USER_2.password });
    u2Token = r2.body.token;

    const r3 = await request(app).post('/api/auth/login').send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
    adminToken = r3.body.token;
});

afterAll(async () => {
    slotManager.stopLoop();
    await cleanDatabase();
    await prisma.$disconnect();
});

// ──────────────────────────────────────────────────────────────
// 1) Falcı Başvurusu ve Yönetimi
// ──────────────────────────────────────────────────────────────
describe('🔮 Falcı Başvurusu ve Yönetimi', () => {
    test('Eksik bilgiyle başvuru reddedilmeli', async () => {
        const res = await request(app).post('/api/teller/apply').set('Authorization', `Bearer ${u1Token}`)
            .send({ experience: '' });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('Başarılı falcı başvurusu PENDING durumuna geçmeli', async () => {
        const res = await request(app).post('/api/teller/apply').set('Authorization', `Bearer ${u1Token}`)
            .send({ experience: '3-5 Yıl', fortuneTypes: ['TAROT', 'KAHVE'] });
        expect(res.status).toBe(200);
        expect(res.body.application).toBeDefined();
        expect(res.body.application.status).toBe('PENDING');
        applicationId = res.body.application.id;
    });

    test('Başvuru durumu PENDING dönmeli', async () => {
        const res = await request(app).get('/api/teller/application-status').set('Authorization', `Bearer ${u1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.application.status).toBe('PENDING');
    });

    test('Standart kullanıcı başvuruyu onaylayamaz', async () => {
        const res = await request(app).post('/api/teller/approve-application').set('Authorization', `Bearer ${u2Token}`)
            .send({ applicationId, status: 'APPROVED' });
        expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('Admin başvuruyu onaylayabilmeli ve rol FORTUNE_TELLER olmalı', async () => {
        const res = await request(app).post('/api/teller/approve-application').set('Authorization', `Bearer ${adminToken}`)
            .send({ applicationId, status: 'APPROVED' });
        expect(res.status).toBe(200);

        // Kullanıcının rolü FORTUNE_TELLER oldumu kontrol et
        const userRes = await request(app).get('/api/user/profile/me').set('Authorization', `Bearer ${u1Token}`);
        expect(userRes.body.profile.role).toBe('FORTUNE_TELLER');

        // FortuneTeller tablosundaki gerçek ID yi Prisma'dan oku
        const tellerRecord = await prisma.fortuneTeller.findUnique({ where: { userId: u1Id } });
        expect(tellerRecord).not.toBeNull();
        tellerProfileId = tellerRecord!.id;
    });
});

// ──────────────────────────────────────────────────────────────
// 2) Fal Gönderme, Bakiye Kesintisi ve Yorumlama
// ──────────────────────────────────────────────────────────────
describe('💫 Fal Gönderme, Bakiye Kesintisi ve Yorumlama', () => {
    test('U2 yetersiz bakiye ile fal isteyemez', async () => {
        // Bakiyeyi 50 ye düşür (100 gerekiyor)
        await prisma.user.update({ where: { id: u2Id }, data: { stardustBalance: 50 } });

        const res = await request(app).post('/api/teller/book').set('Authorization', `Bearer ${u2Token}`)
            .send({ tellerId: tellerProfileId, fortuneType: 'KAHVE', question: 'İş hayatım nasıl olacak?' });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('stardust');
    });

    test('U2 yeterli bakiye ile fal isteyebilmeli ve bakiye kesilmeli', async () => {
        // Bakiyeyi 200 ye çık
        await prisma.user.update({ where: { id: u2Id }, data: { stardustBalance: 200 } });

        const res = await request(app).post('/api/teller/book').set('Authorization', `Bearer ${u2Token}`)
            .send({ tellerId: tellerProfileId, fortuneType: 'KAHVE', question: 'İş hayatım nasıl olacak?' });

        // bookAppointment -> res.json({ message, cost }) yani 200 dönüyor
        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
        expect(res.body.cost).toBe(100);

        // Bakiye kesildi mi kontrol (200 - 100 = 100)
        const userRes = await request(app).get('/api/user/profile/me').set('Authorization', `Bearer ${u2Token}`);
        expect(userRes.body.profile.stardustBalance).toBe(100);

        // Prisma'dan appointment ID yi al (en yeni pending)
        const appt = await prisma.appointment.findFirst({
            where: { userId: u2Id, tellerId: tellerProfileId, status: 'PENDING' },
            orderBy: { appointmentDate: 'desc' }
        });
        expect(appt).not.toBeNull();
        appointmentId = appt!.id;
    });

    test('Falcının bekleyen istekler listesinde yeni falı görebilmesi', async () => {
        const res = await request(app).get('/api/teller/fortunes/pending').set('Authorization', `Bearer ${u1Token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);

        const found = res.body.find((f: any) => f.id === appointmentId);
        expect(found).toBeDefined();
    });

    test('Falcı yeterli uzunlukta yorum gönderdiğinde bakiye kazanmalı', async () => {
        const yorum = 'Yıldızlar oldukça parlak görünüyor, kariyer hayatında 3 vakte kadar çok güzel gelişmeler ve yeni bir kapı var. O kapıdan geçmek senin elinde...';
        const u1Before = await request(app).get('/api/user/profile/me').set('Authorization', `Bearer ${u1Token}`);
        const balanceBefore = u1Before.body.profile.stardustBalance;

        const res = await request(app).post('/api/teller/fortunes/interpret').set('Authorization', `Bearer ${u1Token}`)
            .send({ appointmentId, interpretation: yorum });

        // interpretFortune -> res.json({ message, appointmentId, status })
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('COMPLETED');

        // Bakiye kontrol (100 Stardust kazanmalı)
        const u1After = await request(app).get('/api/user/profile/me').set('Authorization', `Bearer ${u1Token}`);
        expect(u1After.body.profile.stardustBalance).toBeGreaterThan(balanceBefore);
    });

    test('Kullanıcının fallarım (my) listesinde yanıtlanan falı görmesi', async () => {
        const res = await request(app).get('/api/teller/fortunes/my').set('Authorization', `Bearer ${u2Token}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);

        const completed = res.body.find((f: any) => f.id === appointmentId);
        expect(completed).toBeDefined();
        expect(completed.status).toBe('COMPLETED');
    });

    test('Yanıtlanan fala puan verilebilmesi (Rating)', async () => {
        const res = await request(app).post('/api/teller/fortunes/rate').set('Authorization', `Bearer ${u2Token}`)
            .send({ appointmentId, rating: 5 });

        // rateTeller -> res.json({ message: 'Rated successfully' })
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Rated');

        // Falcının ortalama puanı güncellenmiş mi?
        const tellerRecord = await prisma.fortuneTeller.findUnique({ where: { id: tellerProfileId } });
        expect(tellerRecord!.rating).toBe(5);
        expect(tellerRecord!.reviewCount).toBe(1);
    });
});
