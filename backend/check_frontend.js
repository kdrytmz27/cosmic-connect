const puppeteer = require('puppeteer');

(async () => {
    let hasError = false;
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Ignore 404s for images/assets, we care about JS runtime errors
                if (!text.includes('favicon.ico') && !text.includes('404')) {
                    console.log('BROWSER_CONSOLE_ERROR:', text);
                    hasError = true;
                }
            }
        });

        page.on('pageerror', error => {
            console.log('BROWSER_PAGE_ERROR:', error.message);
            hasError = true;
        });

        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 10000 });

        // Take a screenshot to visualize
        await page.screenshot({ path: 'frontend_check.png' });

        if (!hasError) {
            console.log('No JS runtime errors found on the main page.');
        }

        await browser.close();
    } catch (error) {
        console.error('SCRIPT_ERROR:', error);
    }
})();
