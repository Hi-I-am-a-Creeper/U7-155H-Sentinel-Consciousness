const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture the JS bundle to find vote mutations
  const jsBundles = [];
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('_next/static/chunks') && url.endsWith('.js')) {
      try {
        const text = await resp.text();
        if (text.includes('vote') || text.includes('invest') || text.includes('upsert')) {
          jsBundles.push({ url: url.substring(0, 100), size: text.length });
          // Find the vote mutation name
          const voteMatch = text.match(/vote\.\w+/g);
          if (voteMatch) console.log('Vote refs found in', url.substring(0, 80), ':', [...new Set(voteMatch)]);
          const upsertMatch = text.match(/\.upsert\b/g);
          if (upsertMatch) console.log('Upsert refs in', url.substring(0, 80), ':', upsertMatch.length);
          const investMatch = text.match(/invest/g);
          if (investMatch) console.log('"invest" in', url.substring(0, 80));
        }
      } catch(e) {}
    }
    // Also check API responses
    if (url.includes('api/trpc')) {
      try {
        const text = await resp.text();
        if (text.includes('vote')) {
          console.log('VOTE API RESP:', url.substring(0, 120));
          console.log(text.substring(0, 500));
        }
      } catch(e) {}
    }
  });
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // Click the ENABLED decrease buttons for Group 15 to see what they do
  // Index 58 = -5k (enabled), Index 59 = -25k (enabled)
  const buttons = await page.locator('button').all();
  
  // First let's check what the event data says about phase
  const pageData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const t = s.textContent || '';
      if (t.includes('"phase"')) {
        const phaseMatch = t.match(/\"phase\":(\d+)/);
        const currentDemoMatch = t.match(/\"currentDemoId\":\"([^\"]+)\"/);
        return { phase: phaseMatch?.[1], currentDemoId: currentDemoMatch?.[1] };
      }
    }
    return null;
  });
  console.log('Page phase data:', JSON.stringify(pageData));
  
  // Click the +5k button using force (it's disabled but maybe we can force-enable it)
  // Or better yet, let's look at the React source to understand the pattern
  // Let me check the app chunk for vote related code
  for (const bundle of jsBundles) {
    console.log('JS bundle:', bundle.url, 'size:', bundle.size);
  }
  
  // Try clicking the disabled +25k for group 15 using force
  console.log('\n=== Attempting force-click on disabled +25k (button 56) ===');
  await buttons[56].click({ force: true });
  await page.waitForTimeout(500);
  
  // Check localStorage
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  console.log('localStorage after click:', ls);
  
  // Try JavaScript dispatchEvent approach
  console.log('\n=== Trying JS click via dispatchEvent ===');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const btn = buttons[56];
    if (btn) {
      btn.disabled = false;
      btn.click();
    }
  });
  await page.waitForTimeout(500);
  
  const ls2 = await page.evaluate(() => JSON.stringify(localStorage));
  console.log('localStorage after JS click:', ls2);
  
  await browser.close();
})();
