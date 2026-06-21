const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Trap ALL network activity
  const allReqs = [];
  page.on('request', req => {
    allReqs.push({ url: req.url(), method: req.method(), postData: req.postData() });
  });
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // Get initial localStorage
  let votes = await page.evaluate(() => localStorage.getItem('votes'));
  console.log('Initial votes:', votes);
  
  // Click button index 56 (+25k for SENTINEL Group 15, first of 4 buttons)
  const buttons = await page.locator('button').all();
  
  console.log(`\nButton 56 text: "${await buttons[56].textContent()}"`);
  console.log(`Button 57 text: "${await buttons[57].textContent()}"`);
  console.log(`Button 58 text: "${await buttons[58].textContent()}"`);
  console.log(`Button 59 text: "${await buttons[59].textContent()}"`);
  
  // Click the +25k (button 56)
  console.log('\n=== Clicking button 56 (+25k for Group 15) ===');
  await buttons[56].click();
  await page.waitForTimeout(500);
  
  // Check votes after click
  votes = await page.evaluate(() => localStorage.getItem('votes'));
  console.log('Votes after 1st click:', votes);
  
  // Also check if any new requests were made
  const newReqs = allReqs.filter(r => r.url.includes('api/trpc') && r.method === 'POST');
  console.log('\nPOST requests:');
  for (const req of newReqs) {
    console.log(req.url);
    console.log(req.postData);
    console.log('---');
  }
  
  // Click +25k again
  console.log('\n=== Clicking +25k again ===');
  await buttons[56].click();
  await page.waitForTimeout(500);
  
  votes = await page.evaluate(() => localStorage.getItem('votes'));
  console.log('Votes after 2nd click:', votes);
  
  // Click +5k (button 57)
  console.log('\n=== Clicking button 57 (+5k) ===');
  await buttons[57].click();
  await page.waitForTimeout(500);
  
  votes = await page.evaluate(() => localStorage.getItem('votes'));
  console.log('Votes after +5k:', votes);
  
  // Check full localStorage
  const fullLS = await page.evaluate(() => JSON.stringify(localStorage));
  console.log('\nFull localStorage:', fullLS);
  
  // Check the UI
  const group15Amount = await page.evaluate(() => {
    const allText = document.body.innerText;
    const idx = allText.indexOf('SENTINEL (Group 15)');
    // Show 200 chars after the group name
    return allText.substring(idx, idx + 80);
  });
  console.log('Group 15 display:', group15Amount);
  
  await browser.close();
})();
