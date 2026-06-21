#!/bin/bash
# Script called by cron to send jokes to both channels
# Takes joke text on stdin, or generates one via AI

JOKE="$1"
DISCORD_TOKEN="${DISCORD_BOT_TOKEN:?Set DISCORD_BOT_TOKEN env var}"
TELEGRAM_TOKEN="${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN env var}"
TELEGRAM_CHAT="7828409322"
DISCORD_CHANNEL="1516425355781476495"

# Escape for JSON
joke_escaped=$(echo "$JOKE" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))")

# Send to Discord
curl -s -X POST "https://discord.com/api/v10/channels/$DISCORD_CHANNEL/messages" \
  -H "Authorization: Bot $DISCORD_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"content\":$joke_escaped}" > /dev/null 2>&1

# Send to Telegram
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":$TELEGRAM_CHAT,\"text\":$joke_escaped}" > /dev/null 2>&1

echo "Joke sent: $JOKE"
