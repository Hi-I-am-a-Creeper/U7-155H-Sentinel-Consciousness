const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture the main event data response
  let eventData = null;
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('event.get,') && url.includes('H5V')) {
      try {
        const body = await resp.json();
        if (body?.[1]?.result?.data?.json?.demos) {
          eventData = body[1].result.data.json;
          console.log('=== CAPTURED EVENT DATA ===');
          console.log('Demos:');
          for (const d of eventData.demos) {
            console.log(`  [${d.index}] ${d.name} -> ${d.id} (votable: ${d.votable})`);
          }
          console.log('Awards:', JSON.stringify(eventData.awards));
        }
      } catch(e) {}
    }
    if (url.includes('attendee.upsert')) {
      try {
        const body = await resp.json();
        console.log('\nAttendee response:', JSON.stringify(body).substring(0, 300));
      } catch(e) {}
    }
  });
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // Get the attendee ID from localStorage
  const attendeeId = await page.evaluate(() => {
    const a = JSON.parse(localStorage.getItem('attendee') || '{}');
    return a.id;
  });
  console.log('\nAttendee ID:', attendeeId);
  
  // Now set up for multiple votes
  // First let's allocate all $100k to group 15 via API calls
  if (eventData) {
    const group15 = eventData.demos.find(d => d.name && (d.name.includes('SENTINEL') || d.name.includes('Group 15')));
    const awardId = eventData.awards?.[0]?.id;
    
    console.log('\nGroup 15:', JSON.stringify(group15));
    console.log('Award ID:', awardId);
    
    // Make the remaining votes via direct API calls
    const demoId = group15.id;
    
    // Click +25k 3 more times to total $100k
    console.log('\n=== Clicking +25k to max out ===');
    const buttons = await page.locator('button').all();
    
    for (let i = 0; i < 3; i++) {
      // Button 59 = +25k for group 15
      await page.evaluate(() => {
        const btn = document.querySelectorAll('button')[59];
        if (btn) btn.disabled = false;
      });
      await buttons[59].click();
      await page.waitForTimeout(300);
      
      const votes = await page.evaluate(() => localStorage.getItem('votes'));
      console.log(`Click ${i+2}:`, votes);
    }
    
    // Check final state
    const finalState = await page.evaluate(() => {
      const allText = document.body.innerText;
      const g15Idx = allText.indexOf('SENTINEL (Group 15)');
      const fundIdx = allText.indexOf('Your Scout Fund');
      return {
        group15: allText.substring(g15Idx, g15Idx + 80),
        fund: allText.substring(fundIdx, fundIdx + 80)
      };
    });
    console.log('\nFinal state:', JSON.stringify(finalState));
  }
  
  await browser.close();
})();
