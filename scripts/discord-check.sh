#!/usr/bin/env bash
set -euo pipefail
DCTOKEN=$(python3 -c "import json; c=json.load(open('/home/ubuntu/.openclaw/openclaw.json')); print(c['channels']['discord']['token'])")

curl -s -H "Authorization: Bot ${DCTOKEN}" \
  "https://discord.com/api/v10/guilds/1515372398109786112/members?limit=100" | \
  python3 -c "
import sys, json
members = json.load(sys.stdin)
for m in members:
    user = m.get('user', {})
    if user.get('bot'):
        print(f'Bot: {user.get(\"username\",\"?\")}#{user.get(\"discriminator\",\"?\")} (ID: {user.get(\"id\",\"?\")})')
" 2>/dev/null
