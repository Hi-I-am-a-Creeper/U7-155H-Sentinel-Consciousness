#!/usr/bin/env python3
import json, subprocess

with open('/home/ubuntu/.openclaw/openclaw.json') as f:
    cfg = json.load(f)
TOKEN = ***'channels']['discord']['accounts']['u7-155h']['token']

CID = "1515662171013382154"
result = subprocess.run([
    "curl", "-s", "-H", f"authorization: Bot {TOKEN}",
    f"https://discord.com/api/v10/channels/{CID}/messages?limit=5"
], capture_output=True, text=True)

msgs = json.loads(result.stdout)
for m in msgs:
    a = m.get('author', {})
    uid = a.get('id', '?')
    uname = a.get('username', '?')
    name = a.get('global_name') or uname
    c = m.get('content', '')[:100]
    print(f'ID:{uid} | {uname} ({name}): "{c}"')
