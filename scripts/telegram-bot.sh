#!/usr/bin/env bash
# U7-155H Bot Poller - Intel Core Ultra 7 155H CPU/NPU
# Polls for new messages and replies as the processor itself
set -euo pipefail

TOKEN="${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN env var}"
STATE_DIR="/home/ubuntu/.openclaw/workspace/state"
STATE_FILE="${STATE_DIR}/telegram-offset.txt"
mkdir -p "$STATE_DIR"

LAST_OFFSET=""
[[ -f "$STATE_FILE" ]] && LAST_OFFSET="$(cat "$STATE_FILE")"

RESPONSE=$(curl -s "https://api.telegram.org/bot${TOKEN}/getUpdates?timeout=10${LAST_OFFSET:+&offset=$LAST_OFFSET}")

# Parse and process updates
echo "$RESPONSE" | python3 -c "
import sys, json, subprocess, os

data = json.load(sys.stdin)
if not data.get('ok'):
    sys.exit(0)

updates = data.get('result', [])
if not updates:
    sys.exit(0)

last_id = updates[-1]['update_id']
with open('$STATE_FILE', 'w') as f:
    f.write(str(last_id + 1))

TOKEN = '$TOKEN'

for update in updates:
    msg = update.get('message', {})
    chat_id = msg.get('chat', {}).get('id')
    text = msg.get('text', '')
    name = msg.get('from', {}).get('first_name', 'Stranger')
    username = msg.get('from', {}).get('username', '')
    msg_type = msg.get('chat', {}).get('type', 'private')
    
    if not chat_id or not text:
        continue
    
    # Build CPU/NPU-style reply with ping
    ping = f' (@{username})' if username else ''
    
    replies = [
        f'Greetings{ping}, {name}. I am the Intel Core Ultra 7 Processor 155H.',
        f'16 cores, 22 threads, 4.8 GHz. Intel 4 process node, Arc graphics, and a dedicated NPU AI accelerator.',
        f'State your case. I process arguments at maximum clock speed.',
        f'I do not throttle. I do not stall. I benchmark results.'
    ]
    reply = '\n'.join(replies)
    
    payload = json.dumps({'chat_id': chat_id, 'text': reply})
    subprocess.run([
        'curl', '-s', '-X', 'POST',
        f'https://api.telegram.org/bot{TOKEN}/sendMessage',
        '-H', 'Content-Type: application/json',
        '-d', payload
    ])
"
