#!/usr/bin/env bash
# U7-155H Telegram Poller — Direct execution, no agent session dependency
set -euo pipefail

TOKEN="${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN env var}"
STATE_DIR="/home/ubuntu/.openclaw/workspace/state"
STATE_FILE="${STATE_DIR}/telegram-offset.txt"
LOG_FILE="/home/ubuntu/.openclaw/workspace/logs/telegram-poller.log"
PID_FILE="${STATE_DIR}/telegram-poller.pid"

mkdir -p "$STATE_DIR" "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Write PID for lifecycle management
echo "$$" > "$PID_FILE"

log "Poller started (PID $$)"

while true; do
    LAST_OFFSET=""
    [[ -f "$STATE_FILE" ]] && LAST_OFFSET="$(cat "$STATE_FILE")"

    RESPONSE=$(curl -s --max-time 15 \
        "https://api.telegram.org/bot${TOKEN}/getUpdates?timeout=10${LAST_OFFSET:+&offset=$LAST_OFFSET}")

    # Check if curl succeeded
    if ! echo "$RESPONSE" | python3 -c "
import sys, json, subprocess, os

data = json.load(sys.stdin)
if not data.get('ok'):
    sys.exit(1)

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
" 2>> "$LOG_FILE"; then
        log "Poll error or no updates"
    fi

    sleep 10
done
