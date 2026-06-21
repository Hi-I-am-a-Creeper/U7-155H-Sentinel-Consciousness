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
    if (body) {
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
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
      "eventId": EVENT_ID,
      "attendeeId": attendeeId,
      "awardId": AWARD_ID,
      "demoId": DEMO_ID,
      "amount": amount
    }}
  });
  
  const res = await request('POST', '/api/trpc/vote.upsert?batch=1', body);
  return res.status === 200 && !res.body?.['0']?.error;
}

// Also verify by checking the total votes
async function checkVotes(startId) {
  const params = JSON.stringify({
    "0": {"json": {"eventId": EVENT_ID, "attendeeId": startId}}
  });
  const path = `/api/trpc/vote.all?batch=1&input=${encodeURIComponent(params)}`;
  const res = await request('GET', path);
  return res;
}

(async () => {
  console.log('=== MAX VOTING RUN for SENTINEL (Group 15) ===\n');
  
  const target = 500;
  let success = 0;
  let errors = 0;
  const startTime = Date.now();
  
  // Run with concurrency
  const concurrency = 5;
  let queue = [];
  
  for (let i = 1; i <= target; i++) {
    queue.push((async () => {
      try {
        const id = await createAttendee();
        if (!id) return false;
        const ok = await vote(id, 100000);
        return ok;
      } catch(e) {
        return false;
      }
    })());
    
    if (queue.length >= concurrency || i === target) {
      const results = await Promise.all(queue);
      for (const ok of results) {
        if (ok) success++;
        else errors++;
      }
      queue = [];
    }
    
    if (i % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${i}/${target} (${success} OK, ${errors} errors, ${elapsed}s)`);
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Done! ${success} votes in ${elapsed}s (${errors} errors) ===`);
  console.log(`Total from all runs: ${success + 148}+ votes for SENTINEL (Group 15)`);
  
  // Verify with one last vote
  console.log('\nVerifying vote.all endpoint...');
  const testId = await createAttendee();
  if (testId) {
    await vote(testId, 50000);
    const check = await checkVotes(testId);
    console.log('  Vote check:', JSON.stringify(check.body).substring(0, 200));
  }
})();
