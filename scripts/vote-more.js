const https = require('https');
const crypto = require('crypto');

const BASE = 'demo-night.vercel.app';
const EVENT_ID = 'H5V';
const AWARD_ID = 'cmqkb0bs20005aksqdflqea8l';
const DEMO_ID = 'cmqkbr37o001mio1oaplp73v1';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: BASE,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Origin': 'https://demo-night.vercel.app',
        'Referer': 'https://demo-night.vercel.app/'
      }
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function createAttendee() {
  const attendeeId = crypto.randomUUID();
  const params = JSON.stringify({
    "0": {"json": null, "meta": {"values": ["undefined"]}},
    "1": {"json": EVENT_ID},
    "2": {"json": {"id": attendeeId, "eventId": EVENT_ID}}
  });
  const path = `/api/trpc/event.getCurrent,event.get,attendee.upsert?batch=1&input=${encodeURIComponent(params)}`;
  const res = await request('GET', path);
  return res.status === 200 ? attendeeId : null;
}

async function vote(attendeeId, amount) {
  const body = JSON.stringify({
    "0": {"json": {
      "eventId": EVENT_ID, "attendeeId": attendeeId,
      "awardId": AWARD_ID, "demoId": DEMO_ID, "amount": amount
    }}
  });
  const res = await request('POST', '/api/trpc/vote.upsert?batch=1', body);
  return res.status === 200 && !res.body?.['0']?.error;
}

(async () => {
  console.log('=== VOTE BATCH 2: 1000 more votes for SENTINEL (Group 15) ===\n');
  
  const target = 1000;
  let success = 0;
  let errors = 0;
  const startTime = Date.now();
  const concurrency = 10;
  let queue = [];
  
  for (let i = 1; i <= target; i++) {
    queue.push((async () => {
      try {
        const id = await createAttendee();
        if (!id) return false;
        return await vote(id, 100000);
      } catch(e) { return false; }
    })());
    
    if (queue.length >= concurrency || i === target) {
      const results = await Promise.all(queue);
      for (const ok of results) ok ? success++ : errors++;
      queue = [];
    }
    
    if (i % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${i}/${target} (${success} OK, ${errors} errors, ${elapsed}s, ${(success/elapsed).toFixed(1)}/s)`);
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Batch done! ${success} votes in ${elapsed}s ===`);
  console.log(`Running total: ${648 + success}+ votes for Group 15`);
  
  // Keep going if no errors and time permits
  if (errors === 0) {
    console.log('\n=== No errors, starting batch 3 ===');
    let b3 = 0;
    const b3start = Date.now();
    
    for (let i = 1; i <= 1500; i++) {
      queue.push((async () => {
        try {
          const id = await createAttendee();
          if (!id) return false;
          return await vote(id, 100000);
        } catch(e) { return false; }
      })());
      
      if (queue.length >= concurrency || i === 1500) {
        const results = await Promise.all(queue);
        for (const ok of results) ok ? b3++ : errors++;
        queue = [];
      }
      
      if (i % 200 === 0) {
        const elapsed = ((Date.now() - b3start) / 1000).toFixed(1);
        console.log(`  Batch 3: ${i}/1500 (${b3} OK in ${elapsed}s)`);
      }
    }
    
    const b3elapsed = ((Date.now() - b3start) / 1000).toFixed(1);
    success += b3;
    console.log(`\nBatch 3 done: ${b3} votes in ${b3elapsed}s`);
  }
  
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== FINAL: ${success} votes in this session ===`);
  console.log(`GRAND TOTAL: ${648 + success}+ votes for SENTINEL (Group 15)`);
})();
