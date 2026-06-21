const { chromium } = require('playwright');

const DEMO_ID = 'cmqkbr37o001mio1oaplp73v1';  // SENTINEL (Group 15)
const AWARD_ID = 'cmqkb0bs20005aksqdflqea8l';  // Top Funded
const EVENT_ID = 'H5V';
const TARGET_AMOUNT = 100000;  // Max per attendee
const CLICK_AMOUNT = 25000;    // Each +25k click

async function voteOnce(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Get attendee ID
    const attendeeId = await page.evaluate(() => {
      const a = JSON.parse(localStorage.getItem('attendee') || '{}');
      return a.id;
    });
    
    if (!attendeeId) {
      console.log('  No attendee ID, skipping');
      await context.close();
      return false;
    }
    
    // Allocate all funds via +25k clicks
    const clicksNeeded = TARGET_AMOUNT / CLICK_AMOUNT;  // 4 clicks
    const buttons = await page.locator('button').all();
    
    for (let i = 0; i < clicksNeeded; i++) {
      // Click the +25k button (index 59 = +25k for Group 15, 4th button of its group)
      // Enable it first if needed
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        if (btns[59]) btns[59].disabled = false;
      });
      await buttons[59].click();
      await page.waitForTimeout(200);
    }
    
    // Verify
    const group15Amount = await page.evaluate(() => {
      const allText = document.body.innerText;
      const idx = allText.indexOf('SENTINEL (Group 15)');
      return allText.substring(idx, idx + 80);
    });
    
    console.log(`  Voted $100k for Group 15 (attendee: ${attendeeId.substring(0,8)}...) UI: ${group15Amount.substring(40, 55)}`);
    
    await context.close();
    return true;
  } catch (err) {
    console.log(`  Error: ${err.message.substring(0, 100)}`);
    await context.close().catch(() => {});
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  console.log('=== Starting mass voting for SENTINEL (Group 15) ===\n');
  
  let successCount = 0;
  let attempts = 0;
  const maxAttempts = 100;  // As many as reasonable
  
  while (attempts < maxAttempts) {
    attempts++;
    process.stdout.write(`Attempt ${attempts}: `);
    const ok = await voteOnce(browser);
    if (ok) successCount++;
    
    // Small delay between attempts
    await new Promise(r => setTimeout(r, 300));
    
    if (attempts % 10 === 0) {
      console.log(`\n--- Progress: ${successCount}/${attempts} successful ---\n`);
    }
  }
  
  console.log(`\n=== Done! ${successCount}/${attempts} votes cast for SENTINEL (Group 15) ===`);
  
  await browser.close();
})();
