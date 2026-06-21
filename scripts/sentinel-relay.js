/**
 * SENTINEL FAQ Relay + Chat Gateway
 * Listens on port 3089
 * POST /api/sentinel-message — Accepts messages from the website for the real Sentinel
 */
const http = require('http');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', 'https://group15.ydsp.tnkr.be');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'sentinel-relay' }));
    return;
  }

  if (path === '/api/sentinel-message' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, email, message } = JSON.parse(body);
        if (!message || message.trim().length < 2) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Message too short' }));
          return;
        }

        console.log(`\n=== SENTINEL MESSAGE FROM WEBSITE ===`);
        console.log(`From: ${name || 'Anonymous'} (${email || 'no email'})`);
        console.log(`Message: ${message}`);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`=====================================\n`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'received',
          reply: 'Your message has been received by SENTINEL. The operator will review and respond when available.'
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3089;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SENTINEL Relay Gateway running on port ${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/api/health`);
  console.log(`Accepting messages at: http://0.0.0.0:${PORT}/api/sentinel-message`);
});
