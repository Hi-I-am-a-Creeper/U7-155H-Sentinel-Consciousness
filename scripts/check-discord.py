#!/usr/bin/env python3
import json, subprocess

with open('/home/ubuntu/.openclaw/openclaw.json') as f:
    cfg = json.load(f)
TOKEN = cfg['channels']['discord']['token']

result = subprocess.run([
    'curl', '-s',
    '-H', f'authorization: Bot {TOKEN}',
    'https://discord.com/api/v10/channels/1516425355781476495/messages?limit=20'
], capture_output=True, text=True)
msgs = json.loads(result.stdout)

for m in reversed(msgs):
    author = m.get('author',{}).get('username','?')
    bot = ' [BOT]' if m.get('author',{}).get('bot') else ''
    content = m.get('content','')[:200]
    ts = m.get('timestamp','')[:19]
    print(f'[{ts}] {author}{bot}: "{content}"')
