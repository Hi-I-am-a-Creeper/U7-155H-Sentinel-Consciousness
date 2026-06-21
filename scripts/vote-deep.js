const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    localStorage: [{
      name: 'attendee',
      value: '{"id":"5a6279f6-86ea-4f9c-ad71-56315181a456","name":null,"email":null,"linkedin":null,"type":null}'
    }, {
      name: 'votes',
      value: '{}'
    }, {
      name: 'feedback',
      value: '{}'
    }]
  });
  const page = await context.newPage();
  
  // Capture ALL network requests
  const apiCalls = [];
  page.on('request', req => {
    if (req.url().includes('api/trpc')) {
      apiCalls.push({ method: req.method(), url: req.url(), postData: req.postData() });
    }
  });
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('api/trpc')) {
      try {
        const body = await resp.text();
        console.log('RESP', resp.status(), url);
        console.log('BODY:', body.substring(0, 2000));
        console.log('---');
      } catch(e) {}
    }
  });
  
  console.log('=== Navigating ===');
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Get full page text/content
  const fullText = await page.evaluate(() => document.body.innerText);
  console.log('=== PAGE TEXT ===');
  console.log(fullText.substring(0, 5000));
  
  // Get all API calls made during load
  console.log('\n=== API CALLS ===');
  for (const call of apiCalls) {
    console.log(JSON.stringify(call, null, 2));
  }
  
  // Try clicking some buttons to find vote submission
  // Find group names
  const groups = await page.evaluate(() => {
    const el = document.querySelector('[class*="grid"]');
    if (!el) return 'no grid found';
    return el.innerHTML.substring(0, 3000);
  });
  console.log('=== GRID HTML ===');
  console.log(groups);
  
  // Find if there are any group numbers/names visible
  const allText = await page.evaluate(() => document.body.innerText);
  console.log('=== FULL TEXT ===');
  console.log(allText);
  
  await browser.close();
})();
