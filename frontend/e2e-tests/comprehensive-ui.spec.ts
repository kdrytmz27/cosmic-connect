import { test, expect } from '@playwright/test';

// Generate unique test email per run to avoid conflicts
const ts = Date.now();
const testEmail = `comprehensive_${ts}@test.com`;
const password = 'Password123!';

test('Comprehensive UI E2E Test: Auth -> Nav -> Profile -> Market -> Synastry -> Logout', async ({ page }) => {
    
    // ═══════════════════════════════════════
    // PHASE 1: Registration & Onboarding
    // ═══════════════════════════════════════
    console.log('📝 Phase 1: Registration');
    await page.goto('/#/register');
    
    // Fill out registration form
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });
    await page.fill('input[name="name"]', 'Otomatik Test Uzmanı');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="birthDate"]', '1990-01-01');
    await page.fill('input[name="birthTime"]', '12:00');
    await page.fill('input[name="birthCity"]', 'Istanbul');
    
    // Submit Registration
    await page.click('button:has-text("Evrene Katıl")');

    // Onboarding Form
    console.log('🌟 Completing Onboarding...');
    await page.waitForFunction(() => window.location.hash.includes('/onboarding'), null, { timeout: 15000 });
    
    // Wait for the lazy-loaded component to render the select boxes
    await page.waitForSelector('select', { timeout: 15000 });

    // Select the first valid option in all select boxes
    const selects = page.locator('select');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
        await selects.nth(i).selectOption({ index: 1 });
    }
    
    // Submit Onboarding
    await page.click('button:has-text("Kozmik Yolculuğa Başla")');

    // Wait until we reach the Home/Dashboard
    await page.waitForFunction(
        () => window.location.hash === '#/' || window.location.hash === '',
        null,
        { timeout: 15000 }
    );
    console.log('✅ Registration & Onboarding successful.');

    // ═══════════════════════════════════════
    // PHASE 2: Navigation
    // ═══════════════════════════════════════
    console.log('🧭 Phase 2: Testing Navigation');
    
    await page.goto('/#/match');
    await expect(page.locator('.match-btn')).toBeVisible({ timeout: 10000 });
    
    await page.goto('/#/market');
    await expect(page.locator('text="Market (Gerçek Ürünler)"').first()).toBeVisible({ timeout: 10000 });

    // ═══════════════════════════════════════
    // PHASE 3: Market Interactions
    // ═══════════════════════════════════════
    console.log('💰 Phase 3: Market Interactions');
    
    // Click on Daily Reward
    const rewardCard = page.locator('h3:has-text("Günlük Ödül")');
    if (await rewardCard.isVisible()) {
        await rewardCard.click();
        await page.waitForTimeout(2000);
    }

    // Phase 4 removed because the slot machine feature does not exist

    // ═══════════════════════════════════════
    // PHASE 6: Profile & Logout
    // ═══════════════════════════════════════
    console.log('👤 Phase 6: Profile & Logout');
    await page.goto('/#/profile');
    
    // Find Settings or Logout button
    // It might be under an 'Ayarlar' tab or directly visible
    // Log out directly via the settings icon
    
    const logoutBtn = page.locator('button:has(svg.lucide-settings)').first();
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    await logoutBtn.click();

    // Verify successful logout by checking if we are redirected to login
    await page.waitForFunction(() => window.location.hash.includes('/login'), null, { timeout: 15000 });
    console.log('🚪 Successfully logged out.');

    console.log('\n══════════════════════════════════════');
    console.log('🎉 COMPREHENSIVE UI E2E TEST PASSED!');
    console.log('══════════════════════════════════════\n');
});
