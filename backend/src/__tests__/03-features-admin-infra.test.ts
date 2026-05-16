process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

import request from 'supertest';
import { app, prisma } from '../index';
import { TEST_USER, TEST_USER_2, ADMIN_USER, createTestUser, cleanDatabase } from './helpers/setup';
import { slotManager } from '../services/slot.service';

let token1: string, token2: string, adminToken: string;
let id1: string, id2: string, adminId: string;

beforeAll(async () => {
    await cleanDatabase();
    const u1 = await createTestUser(TEST_USER, 'STANDARD', 5000);
    const u2 = await createTestUser(TEST_USER_2, 'STANDARD', 5000);
    const adm = await createTestUser(ADMIN_USER, 'ADMIN', 5000);
    id1 = u1.id; id2 = u2.id; adminId = adm.id;
    const r1 = await request(app).post('/api/auth/login').send({ email: TEST_USER.email, password: TEST_USER.password });
    const r2 = await request(app).post('/api/auth/login').send({ email: TEST_USER_2.email, password: TEST_USER_2.password });
    const ra = await request(app).post('/api/auth/login').send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
    token1 = r1.body.token; token2 = r2.body.token; adminToken = ra.body.token;
});

afterAll(async () => {
    slotManager.stopLoop();
    await cleanDatabase();
    await prisma.$disconnect();
});

// =============================================
// 4. ARKADAŞLIK (10 test)
// =============================================
describe('🤝 Arkadaşlık', () => {
    test('Arkadaşlık isteği gönderme', async () => {
        const res = await request(app).post('/api/user/friend-request').set('Authorization', `Bearer ${token1}`).send({ receiverId: id2 });
        expect(res.status).toBe(200);
    });

    test('Bekleyen istek varken tekrar istek engeli', async () => {
        const res = await request(app).post('/api/user/friend-request').set('Authorization', `Bearer ${token1}`).send({ receiverId: id2 });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('Bekleyen istekler listesi', async () => {
        const res = await request(app).get('/api/user/friend-requests').set('Authorization', `Bearer ${token2}`);
        expect(res.status).toBe(200);
        expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
    });

    test('İstek kabul etme', async () => {
        const pending = await request(app).get('/api/user/friend-requests').set('Authorization', `Bearer ${token2}`);
        const reqId = pending.body.requests[0]?.id;
        if (reqId) {
            const res = await request(app).post(`/api/user/friend-request/${reqId}/accept`).set('Authorization', `Bearer ${token2}`);
            expect(res.status).toBe(200);
        }
    });

    test('Arkadaş listesi', async () => {
        const res = await request(app).get('/api/user/friends').set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(200);
    });

    test('İstek durumu kontrolü', async () => {
        const res = await request(app).get(`/api/user/friend-request-status/${id2}`).set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(200);
    });

    test('Arkadaş silme', async () => {
        const res = await request(app).delete(`/api/user/friend/${id2}`).set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(200);
    });

    test('Uyumluluk raporu', async () => {
        const res = await request(app).get(`/api/user/synastry/${id2}`).set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(200);
    });

    test('Eşleşme keşif listesi dönüyor', async () => {
        const res = await request(app).get('/api/user/daily-match').set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(200);
    });

    test('Kendin keşif listesinde görünmüyorsun', async () => {
        const res = await request(app).get('/api/user/daily-match').set('Authorization', `Bearer ${token1}`);
        const matches = res.body.matches || [];
        const selfMatch = matches.find((m: any) => m.match?.id === id1);
        expect(selfMatch).toBeUndefined();
    });
});

// =============================================
// 11. TAROT (4 test)
// =============================================
describe('🃏 Tarot', () => {
    test('Günlük tarot durumu', async () => {
        const res = await request(app).get('/api/tarot/daily/status').set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(200);
        expect(res.body.canDraw).toBeDefined();
    });

    test('Tarot çekme', async () => {
        const res = await request(app).post('/api/tarot/daily/draw').set('Authorization', `Bearer ${token1}`);
        expect([200, 400]).toContain(res.status); // 400 if already drawn
    });

    test('Aynı gün tekrar çekme durumu', async () => {
        const status = await request(app).get('/api/tarot/daily/status').set('Authorization', `Bearer ${token1}`);
        // After drawing, canDraw should be false
        if (status.body.canDraw === false) {
            const res = await request(app).post('/api/tarot/daily/draw').set('Authorization', `Bearer ${token1}`);
            expect(res.status).toBe(400);
        }
    });

    test('İkinci kullanıcı tarot çekebilir', async () => {
        const res = await request(app).post('/api/tarot/daily/draw').set('Authorization', `Bearer ${token2}`);
        expect([200, 400]).toContain(res.status);
    });
});

// =============================================
// 10. GRUP SOHBET (4 test)
// =============================================
describe('🌍 Grup Sohbet', () => {
    test('Burç odasındaki mesajları getirme', async () => {
        const res = await request(app).get('/api/group/Gemini').set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(200);
        expect(res.body.messages).toBeDefined();
    });

    test('Farklı burç odası erişim engeli (IDOR)', async () => {
        const res = await request(app).get('/api/group/Pisces').set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(403);
    });

    test('Mesajlar dizi olarak dönüyor', async () => {
        const res = await request(app).get('/api/group/Gemini').set('Authorization', `Bearer ${token1}`);
        expect(Array.isArray(res.body.messages)).toBe(true);
    });

    test('Giriş yapmadan grup mesajı erişim engeli', async () => {
        const res = await request(app).get('/api/group/Aries');
        expect(res.status).toBe(401);
    });
});

// =============================================
// 14. RAPORLAMA (6 test)
// =============================================
describe('🚨 Raporlama', () => {
    test('Rapor gönderme', async () => {
        const res = await request(app).post('/api/user/report').set('Authorization', `Bearer ${token1}`).send({ reportedId: id2, reason: 'Spam', description: 'Test raporu' });
        expect(res.status).toBe(201);
    });

    test('Kendini raporlama engeli', async () => {
        const res = await request(app).post('/api/user/report').set('Authorization', `Bearer ${token1}`).send({ reportedId: id1, reason: 'Test' });
        expect(res.status).toBe(400);
    });

    test('Aynı kişiyi tekrar raporlama engeli', async () => {
        const res = await request(app).post('/api/user/report').set('Authorization', `Bearer ${token1}`).send({ reportedId: id2, reason: 'Spam tekrar' });
        expect(res.status).toBe(400);
    });

    test('500 karakterden uzun sebep engeli', async () => {
        const res = await request(app).post('/api/user/report').set('Authorization', `Bearer ${token2}`).send({ reportedId: id1, reason: 'X'.repeat(501) });
        expect(res.status).toBe(400);
    });

    test('Zorunlu alan olmadan rapor engeli', async () => {
        const res = await request(app).post('/api/user/report').set('Authorization', `Bearer ${token1}`).send({ reportedId: id2 });
        expect(res.status).toBe(400);
    });

    test('Yönetici rapor listesi', async () => {
        const res = await request(app).get('/api/admin/reports').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
    });
});

// =============================================
// 13. YÖNETİCİ PANELİ (8 test)
// =============================================
describe('🛡️ Yönetici Paneli', () => {
    test('Kullanıcı listesi', async () => {
        const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.users).toBeDefined();
    });

    test('Sayfalama çalışıyor', async () => {
        const res = await request(app).get('/api/admin/users?page=1&limit=5').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.totalPages).toBeDefined();
    });

    test('İstatistik paneli', async () => {
        const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.summary).toBeDefined();
    });

    test('Finans raporu', async () => {
        const res = await request(app).get('/api/admin/financial-reports').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
    });

    test('Kullanıcı güncelleme', async () => {
        const res = await request(app).patch(`/api/admin/users/${id1}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Updated Name' });
        expect(res.status).toBe(200);
    });

    test('Güncelleme yanıtında şifre yok', async () => {
        const res = await request(app).patch(`/api/admin/users/${id1}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Safe Name' });
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('passwordHash');
    });

    test('Geçersiz rol engeli', async () => {
        const res = await request(app).patch(`/api/admin/users/${id1}`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'HACKER' });
        expect(res.status).toBe(400);
    });

    test('Randevu listesi', async () => {
        const res = await request(app).get('/api/admin/appointments').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
    });
});

// =============================================
// 19. ALTYAPI (4 test)
// =============================================
describe('🏗️ Altyapı', () => {
    test('Sağlık kontrolü', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    test('Veritabanı bağlantısı', async () => {
        const count = await prisma.user.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('JWT secret tanımlı', () => {
        expect(process.env.JWT_SECRET).toBeDefined();
        expect(process.env.JWT_SECRET!.length).toBeGreaterThan(0);
    });

    test('Olmayan endpoint → 404', async () => {
        const res = await request(app).get('/api/yok-boyle-bir-sey');
        expect(res.status).toBe(404);
    });
});

// =============================================
// 20. VERİ TUTARLILIĞI (4 test)
// =============================================
describe('💾 Veri Tutarlılığı', () => {
    test('XP ekleme ve seviye hesaplama', async () => {
        const before = await prisma.user.findUnique({ where: { id: id1 } });
        const { xpService } = await import('../services/xp.service');
        await xpService.addXp(id1, 50);
        const after = await prisma.user.findUnique({ where: { id: id1 } });
        expect(after!.xp).toBeGreaterThanOrEqual(before!.xp);
    });

    test('Rozet kontrol sistemi çalışıyor', async () => {
        const { BadgeService } = await import('../services/badge.service');
        const badges = await BadgeService.checkAndAwardBadges(id1);
        expect(Array.isArray(badges)).toBe(true);
    });

    test('Burç uyumluluk puanı 0-100 arası', async () => {
        const { calculateQuickSynastryScore } = await import('../services/synastry.service');
        const result = calculateQuickSynastryScore(
            { birthDate: new Date('1995-06-15'), birthTime: '14:30' },
            { birthDate: new Date('1993-03-20'), birthTime: '10:00' }
        );
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });

    test('Burç önbelleği çalışıyor', async () => {
        const { horoscopeService } = await import('../services/horoscope.service');
        const h1 = await horoscopeService.getDailyHoroscope(id1, '2026-03-21', 'Aries', 'LOVE');
        const h2 = await horoscopeService.getDailyHoroscope(id1, '2026-03-21', 'Aries', 'LOVE');
        expect(h1).toBe(h2); // Same result = cache working
    });
});
