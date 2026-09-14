import puppeteer from 'puppeteer';

(async () => {
    // Launch browser
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    page.on('response', res => {
  if (res.status() >= 400) {
    console.log('HTTP ERROR', res.status(), res.url());
  }
});

    // Navigate to the test page
    console.log('Navigating to http://127.0.0.1:3000/...');
    const response = await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('HTTP Status:', response?.status());

    // Wait a little bit for rendering
    await new Promise(r => setTimeout(r, 2000));

    const content = await page.content();
    console.log('HTML Length:', content.length);
    console.log('Snippet:', content.substring(0, 300));
    
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML.substring(0, 300));
    console.log('Root HTML:', rootHtml);

    await browser.close();
})();
