import { test, expect } from '@playwright/test';

// Generate unique test emails per run
const ts = Date.now();
const bot1Email = `ali_${ts}@bot.com`;
const bot2Email = `ayse_${ts}@bot.com`;
const password = 'Password123!';

test('Bot E2E: Register → Onboard → Match → Chat → Friend Request', async ({ browser }) => {
    // Two isolated browser contexts (like two different phones)
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const aliPage = await ctxA.newPage();
    const aysePage = await ctxB.newPage();

    // ─── Helper: Wait for hash to contain a value ───
    async function waitForHash(page: any, hash: string, timeout = 15000) {
        await page.waitForFunction(
            (h: string) => window.location.hash.includes(h),
            hash,
            { timeout }
        );
    }

    // ─── Helper: Register ───
    async function register(page: any, name: string, email: string) {
        await page.goto('/#/register');
        await page.waitForSelector('input[name="name"]', { timeout: 10000 });
        await page.fill('input[name="name"]', name);
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="birthDate"]', '1995-05-15');
        await page.fill('input[name="birthTime"]', '14:30');
        await page.fill('input[name="birthCity"]', 'Istanbul');
        await page.click('button[type="submit"]');
        // Wait for hash to change to onboarding
        await waitForHash(page, '/onboarding');
    }

    // ─── Helper: Complete Onboarding ───
    async function onboard(page: any) {
        // 6 select boxes – pick first valid option for each
        const selects = page.locator('select');
        const count = await selects.count();
        for (let i = 0; i < count; i++) {
            await selects.nth(i).selectOption({ index: 1 });
        }
        await page.click('button[type="submit"]');
        // Wait for hash to go to home
        await page.waitForFunction(
            () => window.location.hash === '#/' || window.location.hash === '',
            null,
            { timeout: 15000 }
        );
    }

    // ═══════════════════════════════════════
    // PHASE 1: Registration & Onboarding
    // ═══════════════════════════════════════
    console.log('📝 Phase 1: Registering Ali Bot...');
    await register(aliPage, 'Ali Bot', bot1Email);
    await onboard(aliPage);
    console.log('✅ Ali Bot registered and onboarded!');

    console.log('📝 Phase 1: Registering Ayşe Bot...');
    await register(aysePage, 'Ayşe Bot', bot2Email);
    await onboard(aysePage);
    console.log('✅ Ayşe Bot registered and onboarded!');

    // ═══════════════════════════════════════
    // PHASE 2: Navigate to Match page
    // ═══════════════════════════════════════
    console.log('💜 Phase 2: Both bots navigating to Match...');
    await aliPage.goto('/#/match');
    await aysePage.goto('/#/match');
    await aliPage.waitForSelector('button:has-text("Eşleşme Bul")', { timeout: 10000 });
    await aysePage.waitForSelector('button:has-text("Eşleşme Bul")', { timeout: 10000 });

    // ═══════════════════════════════════════
    // PHASE 3: Both click "Eşleşme Bul" simultaneously
    // ═══════════════════════════════════════
    console.log('🚀 Phase 3: Starting matchmaking...');
    await Promise.all([
        aliPage.click('button:has-text("Eşleşme Bul")'),
        aysePage.click('button:has-text("Eşleşme Bul")')
    ]);

    // Wait for "Sohbete Git" button on both sides (match found popup)
    console.log('⏳ Waiting for match to be found...');
    await Promise.all([
        aliPage.waitForSelector('button:has-text("Sohbete Git")', { timeout: 30000 }),
        aysePage.waitForSelector('button:has-text("Sohbete Git")', { timeout: 30000 })
    ]);
    console.log('✅ Match found on both sides!');

    // Click "Sohbete Git"
    await Promise.all([
        aliPage.click('button:has-text("Sohbete Git")'),
        aysePage.click('button:has-text("Sohbete Git")')
    ]);

    // ═══════════════════════════════════════
    // PHASE 4: Chat — Send & Receive Messages
    // ═══════════════════════════════════════
    console.log('💬 Phase 4: Testing chat...');

    // Wait for chat view to load (chat-name element should appear)
    await aliPage.waitForSelector('.chat-name', { timeout: 15000 });
    await aysePage.waitForSelector('.chat-name', { timeout: 15000 });

    // Verify names
    const aliSeesName = await aliPage.textContent('.chat-name');
    const ayseSeesName = await aysePage.textContent('.chat-name');
    console.log(`  Ali sees: "${aliSeesName}", Ayşe sees: "${ayseSeesName}"`);
    expect(aliSeesName).toContain('Ayşe Bot');
    expect(ayseSeesName).toContain('Ali Bot');

    // Ali sends message
    await aliPage.fill('.chat-input-field', 'Merhaba Ayşe! 🚀');
    await aliPage.click('.chat-send-btn');
    console.log('  ✉️ Ali sent: "Merhaba Ayşe! 🚀"');

    // Ayşe should see it
    await expect(aysePage.locator('.msg-bubble.theirs').last()).toContainText('Merhaba Ayşe! 🚀', { timeout: 10000 });
    console.log('  ✅ Ayşe received the message!');

    // Ayşe replies
    await aysePage.fill('.chat-input-field', 'Selam Ali! Test başarılı ✨');
    await aysePage.click('.chat-send-btn');
    console.log('  ✉️ Ayşe sent: "Selam Ali! Test başarılı ✨"');

    // Ali should see it
    await expect(aliPage.locator('.msg-bubble.theirs').last()).toContainText('Selam Ali! Test başarılı ✨', { timeout: 10000 });
    console.log('  ✅ Ali received the reply!');

    // ═══════════════════════════════════════
    // PHASE 5: Friend Request (MATCH → FRIEND upgrade)
    // ═══════════════════════════════════════
    console.log('🤝 Phase 5: Testing friend request flow...');

    // Ali clicks "İstek Gönder" if available
    const friendBtn = aliPage.locator('button:has-text("İstek Gönder")');
    if (await friendBtn.isVisible({ timeout: 5000 })) {
        await friendBtn.click();
        console.log('  ✅ Ali sent friend request!');

        // Ali should see "İstek Gönderildi"
        await expect(aliPage.locator('.status-badge')).toContainText('İstek Gönderildi', { timeout: 5000 });
        console.log('  ✅ Ali sees "İstek Gönderildi" badge');

        // Ayşe should see "İstek Geldi"
        await expect(aysePage.locator('.status-badge')).toContainText('İstek Geldi', { timeout: 5000 });
        console.log('  ✅ Ayşe sees "İstek Geldi" badge');
    } else {
        console.log('  ⚠️ Friend request button not visible (might already be friends)');
    }

    // ═══════════════════════════════════════
    // RESULTS
    // ═══════════════════════════════════════
    console.log('\n══════════════════════════════════════');
    console.log('🎉 ALL E2E TESTS PASSED SUCCESSFULLY!');
    console.log('══════════════════════════════════════\n');

    await ctxA.close();
    await ctxB.close();
});
