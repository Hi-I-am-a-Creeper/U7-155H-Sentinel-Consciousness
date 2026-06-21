const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture vote mutations
  page.on('request', req => {
    if (req.url().includes('api/trpc') && req.method() === 'POST') {
      console.log('POST REQ:', req.url());
      console.log('DATA:', req.postData());
      console.log('---');
    }
  });
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // Find all visible text to locate group 15's buttons
  // Let's get the full HTML structure around the buttons
  const buttonStructure = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const result = [];
    buttons.forEach((btn, i) => {
      const parent = btn.closest('[class*="grid"]') || btn.parentElement;
      const grandparent = parent?.parentElement;
      const greatGrandparent = grandparent?.parentElement;
      
      // Find group name nearby
      const allText = greatGrandparent?.textContent || grandparent?.textContent || parent?.textContent || '';
      
      result.push({
        index: i,
        text: btn.textContent.trim(),
        parentClass: parent?.className?.substring(0, 50),
        grandparentClass: grandparent?.className?.substring(0, 50),
        nearbyText: allText.substring(0, 60)
      });
    });
    return result;
  });
  
  console.log('=== BUTTON STRUCTURE ===');
  for (const btn of buttonStructure) {
    console.log(`[${btn.index}] "${btn.text}" parent="${btn.parentClass}" nearby="${btn.nearbyText}"`);
  }
  
  // Find Group 15 section by text
  const group15Section = await page.evaluate(() => {
    const allText = document.body.innerText;
    const idx = allText.indexOf('SENTINEL (Group 15)');
    if (idx === -1) return 'NOT FOUND';
    // Get surrounding context
    return allText.substring(Math.max(0, idx - 50), idx + 200);
  });
  console.log('\n=== GROUP 15 CONTEXT ===');
  console.log(group15Section);
  
  // Try clicking all buttons, capture which API calls happen
  // Find button elements for group 15 investment (+25k)
  const buttons = await page.locator('button').all();
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const trimmed = text.trim();
    // Find the "25k" buttons (these are the +25k ones based on position)
    if (trimmed === '25k') {
      // Check if this button is near group 15
      const isNearGroup15 = await buttons[i].evaluate(el => {
        const allText = el.closest('[class*="grid"]')?.textContent || el.parentElement?.textContent || '';
        return allText.includes('SENTINEL') || allText.includes('Group 15');
      });
      
      if (isNearGroup15) {
        console.log(`\n=== Clicking button ${i}: "${trimmed}" (near Group 15) ===`);
        await buttons[i].click();
        await page.waitForTimeout(1000);
      }
    }
  }
  
  // Try the other 25k buttons too
  const buttons2 = await page.locator('button').all();
  for (let i = 0; i < buttons2.length; i++) {
    const text = await buttons2[i].textContent();
    const trimmed = text.trim();
    if (trimmed === '25k') {
      const isNearGroup15 = await buttons2[i].evaluate(el => {
        const allText = el.closest('section')?.textContent || el.parentElement?.textContent || '';
        return allText.includes('SENTINEL') || allText.includes('Group 15');
      });
      
      if (isNearGroup15) {
        console.log(`\n=== Clicking button ${i}: "${trimmed}" (near Group 15 via section) ===`);
        await buttons2[i].click();
        await page.waitForTimeout(1000);
      }
    }
  }
  
  await browser.close();
})();
