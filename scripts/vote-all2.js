const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  // Get all demo and award data from the page
  const pageData = await page.evaluate(() => {
    // Try __NEXT_DATA__
    const nextEl = document.getElementById('__NEXT_DATA__');
    let eventData = null;
    if (nextEl) {
      const parsed = JSON.parse(nextEl.textContent);
      eventData = parsed?.props?.pageProps?.event;
    }
    
    // Also check localStorage for current state
    const attendee = JSON.parse(localStorage.getItem('attendee') || '{}');
    const remaining = localStorage.getItem('funds');
    
    return {
      eventData: eventData ? {
        id: eventData.id,
        phase: eventData.phase,
        demos: eventData.demos?.map(d => ({ id: d.id, name: d.name, index: d.index, votable: d.votable })),
        awards: eventData.awards
      } : null,
      attendeeId: attendee.id,
      remaining
    };
  });
  
  console.log('Page data:', JSON.stringify(pageData, null, 2));
  
  await browser.close();
})();
