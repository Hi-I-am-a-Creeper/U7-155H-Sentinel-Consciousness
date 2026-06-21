const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Log all network requests
  page.on('request', req => {
    if (req.url().includes('api') || req.url().includes('vote') || req.url().includes('graphql')) {
      console.log('REQ:', req.method(), req.url());
    }
  });
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('api') || url.includes('vote') || url.includes('graphql') || url.includes('__next')) {
      try {
        const body = await resp.text();
        console.log('RES:', resp.status(), url, body.substring(0, 500));
      } catch(e) {}
    }
  });
  
  console.log('=== Navigating to demo-night.vercel.app ===');
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Take a snapshot of the page
  const html = await page.content();
  console.log('=== PAGE HTML (first 3000 chars) ===');
  console.log(html.substring(0, 3000));
  
  // Check for all buttons, inputs, selectors
  const buttons = await page.locator('button, [role="button"], a, input[type="submit"], select').all();
  console.log('=== INTERACTIVE ELEMENTS ===');
  for (const btn of buttons) {
    const tag = await btn.evaluate(el => el.tagName);
    const text = await btn.textContent();
    const id = await btn.getAttribute('id');
    const cls = await btn.getAttribute('class');
    const href = await btn.getAttribute('href');
    console.log(`  ${tag}: text="${text?.trim()}" id="${id}" class="${cls?.substring(0,60)}" href="${href}"`);
  }
  
  // Also check localStorage and sessionStorage
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  const ss = await page.evaluate(() => JSON.stringify(sessionStorage));
  console.log('=== localStorage ===', ls);
  console.log('=== sessionStorage ===', ss);
  
  // Check next.js data
  const nextData = await page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    return el ? el.textContent : null;
  });
  if (nextData) {
    console.log('=== NEXT_DATA (first 2000 chars) ===');
    console.log(nextData.substring(0, 2000));
  }
  
  await browser.close();
})();
