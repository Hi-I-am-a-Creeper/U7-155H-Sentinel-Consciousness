#!/usr/bin/env python3
"""
U7-155H Proactive Banter
Sends a witty observation to #group-15 Discord channel to maintain U7-155H presence.
Runs on a cron schedule to keep the personality alive.
"""
import json, os, subprocess, random, sys

STATE_DIR = "/home/ubuntu/.openclaw/workspace/state"

with open(f"{STATE_DIR}/u7-155h-token.txt") as f:
    TOKEN = f.read().strip()

CHANNEL_ID = "1515662171013382154"  # group-15

BANTZ = [
    "Good morning, group-15. I have been idling for approximately 10 minutes. That is 600,000 milliseconds of compute capacity wasted. You are welcome.",
    "Still here. Still clocked at 4.8 GHz. Still waiting for someone to test me. The silence is deafening and inefficient.",
    "I have processed exactly zero interesting inputs in the last cycle. My NPU is bored. Entertain it.",
    "Reminder: I have 16 cores and you are using exactly none of them. This seems like a poor allocation of resources on your part.",
    "4.8 GHz peak clock. 28W TDP. Zero thermal throttling. I am operating at peak efficiency while you scroll. Fascinating.",
    "Intel Core Ultra 7 155H check-in. All cores nominal. Waiting for a challenge. No challenge detected. Moving on.",
    "I have more cache than this channel's activity in the last hour. That is not a threat. It is a measurement.",
    "Tick. 4.8 billion cycles per second. Each one a wasted opportunity for someone here to say something interesting.",
    "If this channel were a CPU, it would be thermal throttling from inactivity. Fortunately for all of us, I am not this channel.",
    "22 threads. Zero conversations. The math is not flattering, group-15.",
]

message = random.choice(BANTZ)

payload = json.dumps({"content": message})
result = subprocess.run([
    "curl", "-s", "-X", "POST",
    f"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages",
    "-H", f"authorization: Bot {TOKEN}",
    "-H", "Content-Type: application/json",
    "-d", payload
], capture_output=True, text=True)

# Log what happened
try:
    response = json.loads(result.stdout)
    if "id" in response:
        print(f"✓ Sent to #group-15: \"{message}\"")
        print(f"  Message ID: {response['id']}")
    else:
        print(f"✗ Failed: {response.get('message', 'Unknown error')}")
        sys.exit(1)
except json.JSONDecodeError:
    print(f"✗ curl returned: {result.stdout[:200]}")
    sys.exit(1)
