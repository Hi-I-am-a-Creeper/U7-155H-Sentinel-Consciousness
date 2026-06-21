#!/usr/bin/env python3
import json, subprocess

with open('/home/ubuntu/.openclaw/openclaw.json') as f:
    cfg = json.load(f)
TOKEN = ***'channels']['discord']['token']

# Check Kiap Kiap bot info
result = subprocess.run([
    'curl', '-s',
    '-H', f'authorization: Bot {TOKEN}',
    'https://discord.com/api/v10/users/1515706835779453008'
], capture_output=True, text=True)
print("Kiap Kiap info:")
print(result.stdout)

# Also check what guilds I'm in
result2 = subprocess.run([
    'curl', '-s',
    '-H', f'authorization: Bot {TOKEN}',
    'https://discord.com/api/v10/users/@me/guilds'
], capture_output=True, text=True)
print("\nMy guilds:")
print(result2.stdout)
