#!/usr/bin/env python3
import json, urllib.request, sys

with open('/home/ubuntu/.openclaw/openclaw.json') as f:
    cfg = json.load(f)
token = cfg['channels']['discord']['token']

# Check who the bot is
req = urllib.request.Request(
    'https://discord.com/api/v10/users/@me',
    headers={'Authorization': f'Bot {token}'}
)
try:
    resp = urllib.request.urlopen(req)
    me = json.loads(resp.read())
    print(f"BOT: {me['username']}#{me.get('discriminator','?')} (ID: {me['id']})")
except Exception as e:
    print(f"getMe failed: {e}")
    sys.exit(1)

# Check guild member list (first 100)
req2 = urllib.request.Request(
    'https://discord.com/api/v10/guilds/1515372398109786112/members?limit=100',
    headers={'Authorization': f'Bot {token}'}
)
try:
    resp2 = urllib.request.urlopen(req2)
    members = json.loads(resp2.read())
    for m in members:
        user = m.get('user', {})
        if user.get('bot'):
            p = m.get('presence', {})
            status = p.get('status', 'no presence data')
            print(f"  {user['username']}#{user.get('discriminator','?')} → {status}")
except Exception as e:
    print(f"Members list failed: {e}")
