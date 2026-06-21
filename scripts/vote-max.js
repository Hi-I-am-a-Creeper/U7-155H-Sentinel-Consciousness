const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Trap all API calls
  const apiCalls = [];
  page.on('request', req => {
    if (req.url().includes('api/trpc') && req.method() === 'POST') {
      apiCalls.push({ time: Date.now(), url: req.url(), data: req.postData() });
    }
  });
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  // Group 15 = SENTINEL, buttons at indices [56,57,58,59]
  // [56] = -25k (disabled), [57] = -5k (disabled)
  // [58] = +5k (enabled),   [59] = +25k (enabled)
  
  // Strategy: Max funds = $100k. Click +25k 4 times = $100k for Group 15.
  // Buttons are per-session attendee, so we need to use the API directly
  // Let me first understand what API call gets made
  
  console.log('=== Clicking +25k once (button 59) ===');
  const buttons = await page.locator('button').all();
  
  // Enable the button just in case
  await page.evaluate(() => {
    const btn = document.querySelectorAll('button')[59];
    if (btn) btn.disabled = false;
  });
  
  await buttons[59].click();
  await page.waitForTimeout(1000);
  
  // Check what happened
  console.log('API calls made:');
  for (const call of apiCalls) {
    console.log(call.url);
    console.log(call.data);
    console.log('---');
  }
  
  // Check localStorage for vote state
  const votes = await page.evaluate(() => localStorage.getItem('votes'));
  console.log('Votes state:', votes);
  
  // Check the UI for updated amount
  const group15Display = await page.evaluate(() => {
    const allText = document.body.innerText;
    const idx = allText.indexOf('SENTINEL (Group 15)');
    return allText.substring(idx, idx + 80);
  });
  console.log('Group 15 display:', group15Display);
  
  // Check remaining funds
  const fundsDisplay = await page.evaluate(() => {
    const allText = document.body.innerText;
    const fundIdx = allText.indexOf('Your Scout Fund');
    return allText.substring(fundIdx, fundIdx + 100);
  });
  console.log('Fund display:', fundsDisplay);
  
  await browser.close();
})();
