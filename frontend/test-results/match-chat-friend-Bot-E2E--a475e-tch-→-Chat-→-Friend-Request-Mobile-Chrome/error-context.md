# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: match-chat-friend.spec.ts >> Bot E2E: Register → Onboard → Match → Chat → Friend Request
- Location: e2e-tests\match-chat-friend.spec.ts:9:1

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/#/onboarding" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Yıldızlara Katıl" [level=1] [ref=e5]
  - generic [ref=e6]:
    - textbox "Ad Soyad" [ref=e7]: Ali Bot
    - textbox "E-posta" [ref=e8]: ali_1780046818516@bot.com
    - textbox "Şifre" [ref=e9]: Password123!
    - textbox [ref=e10]: 1995-05-15
    - textbox [ref=e11]: 14:30
    - 'textbox "Doğum Yeri (Örn: Istanbul)" [ref=e12]': Istanbul
    - button "Evrene Katıl" [active] [ref=e13] [cursor=pointer]
  - paragraph [ref=e14]:
    - text: Zaten yolcu musun?
    - link "Giriş Yap" [ref=e15] [cursor=pointer]:
      - /url: "#/login"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Generate unique test emails per run
  4   | const ts = Date.now();
  5   | const bot1Email = `ali_${ts}@bot.com`;
  6   | const bot2Email = `ayse_${ts}@bot.com`;
  7   | const password = 'Password123!';
  8   | 
  9   | test('Bot E2E: Register → Onboard → Match → Chat → Friend Request', async ({ browser }) => {
  10  |     // Two isolated browser contexts (like two different phones)
  11  |     const ctxA = await browser.newContext();
  12  |     const ctxB = await browser.newContext();
  13  |     const aliPage = await ctxA.newPage();
  14  |     const aysePage = await ctxB.newPage();
  15  | 
  16  |     // ─── Helper: Register ───
  17  |     async function register(page: any, name: string, email: string) {
  18  |         await page.goto('/#/register');
  19  |         await page.waitForSelector('input[name="name"]', { timeout: 10000 });
  20  |         await page.fill('input[name="name"]', name);
  21  |         await page.fill('input[name="email"]', email);
  22  |         await page.fill('input[name="password"]', password);
  23  |         await page.fill('input[name="birthDate"]', '1995-05-15');
  24  |         await page.fill('input[name="birthTime"]', '14:30');
  25  |         await page.fill('input[name="birthCity"]', 'Istanbul');
  26  |         await page.click('button[type="submit"]');
  27  |         // Should redirect to /#/onboarding
> 28  |         await page.waitForURL('**/#/onboarding', { timeout: 15000 });
      |                    ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  29  |     }
  30  | 
  31  |     // ─── Helper: Complete Onboarding ───
  32  |     async function onboard(page: any) {
  33  |         // 6 select boxes – pick first valid option for each
  34  |         const selects = page.locator('select');
  35  |         const count = await selects.count();
  36  |         for (let i = 0; i < count; i++) {
  37  |             await selects.nth(i).selectOption({ index: 1 });
  38  |         }
  39  |         await page.click('button[type="submit"]');
  40  |         // Should redirect to Home /#/
  41  |         await page.waitForURL(url => url.hash === '#/' || url.hash === '', { timeout: 15000 });
  42  |     }
  43  | 
  44  |     // ═══════════════════════════════════════
  45  |     // PHASE 1: Registration & Onboarding
  46  |     // ═══════════════════════════════════════
  47  |     console.log('📝 Phase 1: Registering Ali Bot...');
  48  |     await register(aliPage, 'Ali Bot', bot1Email);
  49  |     await onboard(aliPage);
  50  |     console.log('✅ Ali Bot registered and onboarded!');
  51  | 
  52  |     console.log('📝 Phase 1: Registering Ayşe Bot...');
  53  |     await register(aysePage, 'Ayşe Bot', bot2Email);
  54  |     await onboard(aysePage);
  55  |     console.log('✅ Ayşe Bot registered and onboarded!');
  56  | 
  57  |     // ═══════════════════════════════════════
  58  |     // PHASE 2: Navigate to Match page
  59  |     // ═══════════════════════════════════════
  60  |     console.log('💜 Phase 2: Both bots navigating to Match...');
  61  |     await aliPage.goto('/#/match');
  62  |     await aysePage.goto('/#/match');
  63  |     await aliPage.waitForSelector('button:has-text("Eşleşme Bul")', { timeout: 10000 });
  64  |     await aysePage.waitForSelector('button:has-text("Eşleşme Bul")', { timeout: 10000 });
  65  | 
  66  |     // ═══════════════════════════════════════
  67  |     // PHASE 3: Both click "Eşleşme Bul" simultaneously
  68  |     // ═══════════════════════════════════════
  69  |     console.log('🚀 Phase 3: Starting matchmaking...');
  70  |     await Promise.all([
  71  |         aliPage.click('button:has-text("Eşleşme Bul")'),
  72  |         aysePage.click('button:has-text("Eşleşme Bul")')
  73  |     ]);
  74  | 
  75  |     // Wait for "Sohbete Git" button on both sides (match found popup)
  76  |     console.log('⏳ Waiting for match to be found...');
  77  |     await Promise.all([
  78  |         aliPage.waitForSelector('button:has-text("Sohbete Git")', { timeout: 30000 }),
  79  |         aysePage.waitForSelector('button:has-text("Sohbete Git")', { timeout: 30000 })
  80  |     ]);
  81  |     console.log('✅ Match found on both sides!');
  82  | 
  83  |     // Click "Sohbete Git"
  84  |     await Promise.all([
  85  |         aliPage.click('button:has-text("Sohbete Git")'),
  86  |         aysePage.click('button:has-text("Sohbete Git")')
  87  |     ]);
  88  | 
  89  |     // ═══════════════════════════════════════
  90  |     // PHASE 4: Chat — Send & Receive Messages
  91  |     // ═══════════════════════════════════════
  92  |     console.log('💬 Phase 4: Testing chat...');
  93  | 
  94  |     // Wait for chat view to load (chat-name element should appear)
  95  |     await aliPage.waitForSelector('.chat-name', { timeout: 15000 });
  96  |     await aysePage.waitForSelector('.chat-name', { timeout: 15000 });
  97  | 
  98  |     // Verify names
  99  |     const aliSeesName = await aliPage.textContent('.chat-name');
  100 |     const ayseSeesName = await aysePage.textContent('.chat-name');
  101 |     console.log(`  Ali sees: "${aliSeesName}", Ayşe sees: "${ayseSeesName}"`);
  102 |     expect(aliSeesName).toContain('Ayşe Bot');
  103 |     expect(ayseSeesName).toContain('Ali Bot');
  104 | 
  105 |     // Ali sends message
  106 |     await aliPage.fill('.chat-input-field', 'Merhaba Ayşe! 🚀');
  107 |     await aliPage.click('.chat-send-btn');
  108 |     console.log('  ✉️ Ali sent: "Merhaba Ayşe! 🚀"');
  109 | 
  110 |     // Ayşe should see it
  111 |     await expect(aysePage.locator('.msg-bubble.theirs').last()).toContainText('Merhaba Ayşe! 🚀', { timeout: 10000 });
  112 |     console.log('  ✅ Ayşe received the message!');
  113 | 
  114 |     // Ayşe replies
  115 |     await aysePage.fill('.chat-input-field', 'Selam Ali! Test başarılı ✨');
  116 |     await aysePage.click('.chat-send-btn');
  117 |     console.log('  ✉️ Ayşe sent: "Selam Ali! Test başarılı ✨"');
  118 | 
  119 |     // Ali should see it
  120 |     await expect(aliPage.locator('.msg-bubble.theirs').last()).toContainText('Selam Ali! Test başarılı ✨', { timeout: 10000 });
  121 |     console.log('  ✅ Ali received the reply!');
  122 | 
  123 |     // ═══════════════════════════════════════
  124 |     // PHASE 5: Friend Request (MATCH → FRIEND upgrade)
  125 |     // ═══════════════════════════════════════
  126 |     console.log('🤝 Phase 5: Testing friend request flow...');
  127 | 
  128 |     // Ali clicks "İstek Gönder" if available
```