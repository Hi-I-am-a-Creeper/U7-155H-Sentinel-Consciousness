const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const fullText = await page.evaluate(() => document.body.innerText);
  
  // Show Group 15 section
  const g15Idx = fullText.indexOf('SENTINEL (Group 15)');
  if (g15Idx >= 0) {
    console.log('=== GROUP 15 STATUS ===');
    console.log(fullText.substring(g15Idx, g15Idx + 120));
  }
  
  // Check funds
  const fundIdx = fullText.indexOf('Your Scout Fund');
  if (fundIdx >= 0) {
    console.log('\n=== FUND STATUS ===');
    console.log(fullText.substring(fundIdx, fundIdx + 100));
  }
  
  // Show other groups' investment for comparison
  const groups = ['Clawd (Group 1)', 'MIL AI (Group 2)', 'SENTINEL (Group 15)', 'ATLAS (Group 16)'];
  for (const g of groups) {
    const idx = fullText.indexOf(g);
    if (idx >= 0) {
      const section = fullText.substring(idx, idx + 80).replace(/\n/g, ' | ');
      console.log(`\n${section}`);
    }
  }
  
  // Check the "Results" tab - maybe shows leaderboard
  console.log('\n=== FULL PAGE OVERVIEW ===');
  // Show just the dollar amounts near groups
  const lines = fullText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('$')) {
      console.log(`  ${lines[i-2]?.trim() || ''} ${lines[i-1]?.trim() || ''} > ${lines[i].trim()}`);
    }
  }
  
  await browser.close();
})();
