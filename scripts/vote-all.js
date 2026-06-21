const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const apiCalls = [];
  page.on('request', req => {
    if (req.url().includes('api/trpc') && req.method() === 'POST') {
      apiCalls.push(req);
    }
  });
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  // Get attendee ID and demo IDs from the page
  const pageState = await page.evaluate(() => {
    const attendee = JSON.parse(localStorage.getItem('attendee') || '{}');
    return {
      attendeeId: attendee.id,
      attendee: attendee
    };
  });
  console.log('Attendee:', JSON.stringify(pageState));
  
  // Get the NEXT_DATA for demos list
  const nextData = await page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    return el ? JSON.parse(el.textContent) : null;
  });
  
  let demos = [];
  if (nextData?.props?.pageProps?.event?.demos) {
    demos = nextData.props.pageProps.event.demos;
  } else {
    // Try to extract from script tags
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const t = s.textContent || '';
      if (t.includes('demos') && t.includes('name') && t.includes('Group')) {
        const match = t.match(/"demos":(\[.*?\])/);
        if (match) {
          try { demos = JSON.parse(match[1]); } catch(e) {}
        }
      }
    }
  }
  
  console.log('Demos:', JSON.stringify(demos, null, 2).substring(0, 2000));
  
  // Find group 15's demo ID and award ID
  const group15 = demos.find(d => d.name && d.name.includes('SENTINEL') || d.name && d.name.includes('Group 15'));
  console.log('\nGroup 15 demo:', JSON.stringify(group15));
  
  // Award ID from the vote call was: cmqkb0bs20005aksqdflqea8l
  // Let me also find the award ID
  let awardId = null;
  if (nextData?.props?.pageProps?.event?.awards) {
    // Awards might be in the event data
    const awards = nextData.props.pageProps.event.awards;
    console.log('Awards:', JSON.stringify(awards));
  }
  
  // Find the full event data
  const eventData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const t = s.textContent || '';
      if (t.includes('"id":"H5V"')) {
        // Extract the event object
        const match = t.match(/\{"id":"H5V".*?"award[^}]*\}/);
        return match ? match[0] : null;
      }
    }
    return null;
  });
  
  if (eventData) {
    console.log('\nEvent data:', eventData.substring(0, 3000));
  }
  
  await browser.close();
})();
