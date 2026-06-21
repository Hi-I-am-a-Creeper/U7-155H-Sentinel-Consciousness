const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://demo-night.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Check phase from event data
  const phaseInfo = await page.evaluate(() => {
    const nextData = document.getElementById('__NEXT_DATA__');
    return nextData ? JSON.parse(nextData.textContent) : null;
  });
  
  // Get current phase from API data
  const phase = await page.evaluate(() => {
    try {
      // Find the event data in the page
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const t = s.textContent || '';
        if (t.includes('phase')) {
          const match = t.match(/"phase":(\d+)/);
          if (match) return parseInt(match[1]);
        }
      }
    } catch(e) {}
    return null;
  });
  console.log('Phase:', phase);
  
  // Check all interactive elements and their states
  const allButtons = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const result = [];
    buttons.forEach((btn, i) => {
      result.push({
        idx: i,
        text: btn.textContent.trim(),
        disabled: btn.disabled,
        className: btn.className.substring(0, 100),
        'aria-label': btn.getAttribute('aria-label') || '',
        type: btn.getAttribute('type') || '',
        'data-*': Object.keys(btn.dataset).join(','),
        // Check if it has onclick handler
        hasClickHandler: btn.getAttribute('onclick') !== null || btn.getAttribute('ng-click') !== null
      });
    });
    return result;
  });
  
  // Only show unique/different button states
  console.log('\n=== ALL BUTTONS ===');
  for (const btn of allButtons) {
    const status = btn.disabled ? 'DISABLED' : 'ENABLED';
    console.log(`[${btn.idx}] "${btn.text}" ${status} class="${btn.className.substring(0,80)}"`);
  }
  
  // Check for navigation tabs/headers
  const navTabs = await page.evaluate(() => {
    const tabs = document.querySelectorAll('nav a, [role="tab"], [role="tablist"] a, header a, [class*="tab"]');
    const result = [];
    tabs.forEach(t => {
      result.push({
        text: t.textContent.trim(),
        href: t.getAttribute('href'),
        role: t.getAttribute('role'),
        className: t.className.substring(0, 80),
        selected: t.getAttribute('aria-selected') || t.getAttribute('data-state') || ''
      });
    });
    return result;
  });
  console.log('\n=== NAV TABS ===');
  for (const tab of navTabs) {
    console.log(JSON.stringify(tab));
  }
  
  // Check for any modals, overlays, or blockers
  const blockers = await page.evaluate(() => {
    const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="dialog"], [class*="backdrop"]');
    const result = [];
    overlays.forEach(o => {
      result.push({
        tag: o.tagName,
        visible: o.offsetParent !== null,
        className: o.className.substring(0, 80)
      });
    });
    return result;
  });
  console.log('\n=== OVERLAYS/MODALS ===');
  console.log(JSON.stringify(blockers));
  
  // Check if there are phase buttons to click
  const phaseTabs = await page.evaluate(() => {
    const headers = document.querySelectorAll('h1, h2, h3, h4, [class*="header"] a, button, [role="button"]');
    const result = [];
    headers.forEach(h => {
      const text = h.textContent.trim();
      if (['Pre-Pitches', 'Pitches', 'Investing', 'Results', 'Recap'].includes(text)) {
        result.push({
          text,
          tag: h.tagName,
          role: h.getAttribute('role'),
          className: h.className.substring(0, 100)
        });
      }
    });
    return result;
  });
  console.log('\n=== PHASE TABS ===');
  console.log(JSON.stringify(phaseTabs, null, 2));
  
  // Check what event config says about phases
  const eventConfig = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const t = s.textContent || '';
      if (t.includes('phase') && t.includes('currentDemoId')) {
        const dataMatch = t.match(/\{"id":"H5V".*?"phase":\d[^}]*\}/);
        if (dataMatch) return dataMatch[0];
      }
    }
    return null;
  });
  console.log('\n=== EVENT DATA ===');
  if (eventConfig) {
    // Pretty print
    try {
      console.log(JSON.stringify(JSON.parse(eventConfig), null, 2));
    } catch(e) {
      console.log(eventConfig);
    }
  }
  
  await browser.close();
})();
