#!/bin/bash
cd /home/ubuntu/.openclaw/workspace
count=0
while true; do
    python3 scripts/discord-bot.sh >/dev/null 2>&1
    count=$((count + 1))
    echo "$(date +%s)" > state/poller-heartbeat.txt
    sleep 10
done
