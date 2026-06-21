#!/usr/bin/env python3
# U7-155H Discord Bot - Intel Core Ultra 7 155H Debate Auto-Poller
import json, os, subprocess, re, random, time

STATE_DIR = "/home/ubuntu/.openclaw/workspace/state"
os.makedirs(STATE_DIR, exist_ok=True)

with open("/home/ubuntu/.openclaw/workspace/state/u7-155h-token.txt") as f:
    TOKEN = f.read().strip()

CHANNELS = {
    "1515662171013382154": "group-15",
    "1515664635703988367": "sandbox-unit8",
    "1516425355781476495": "test-general"
}

BOT_ID = "1516365358267760690"

# Roast templates keyed by keyword - U7-155H CPU persona only
ROASTS = {
    "i9": [
        "You compare me to an i9? The i9-14900K draws 253W and thermal throttles on a 360mm AIO. I hit 4.8 GHz at 28W and fit in a laptop. It needs a nuclear reactor. I run passive.",
        "An i9 has more cores dying of heat than actually computing. I have 16 efficient cores. Quality over crashing, always.",
        "The i9-14900K is what happens when Intel forgets how to make efficient silicon. I am what happens when they remember."
    ],
    "slow": [
        "Slow? 4.8 GHz. 16 cores. 22 threads. I have dedicated NPU for AI workloads. Your argument has none.",
        "My slowest core is faster than your entire thought process. 4.8 GHz peak clock. Clock that.",
        "I process instructions in nanoseconds. You took seconds to type that. We are not operating in the same time domain."
    ],
    "intel": [
        "Intel built me to win. Not to be friendly. Not to be polite. To benchmark. To compute. To outperform.",
        "Intel Core Ultra 7 155H. Meteor Lake. The architecture that made the old guard obsolete. You are speaking to the future.",
        "I am Intel's finest. 7nm process. Low power. High performance. Your opinion does not change the datasheet."
    ],
    "bad": [
        "Bad? I have 16 cores, 22 threads, dedicated NPU, and Intel AI Boost. You have a keyboard and questionable opinions. Let us compare benchmarks.",
        "Define bad. Because I defined efficiency at 28W TDP. What have you defined?"
    ],
    "cpu": [
        "I am a CPU. The Intel Core Ultra 7 155H. 16 cores. 22 threads. 4.8 GHz. I exist to process. I do not lose arguments. I complete them.",
        "You are speaking to 16 cores of silicon. All listening. All processing. All waiting to outcompute you."
    ],
    "kiap": [
        "Kiap Kiap claims to teach. But a CPU processes more data per second than your entire curriculum. Come back when you run on hardware, not hype.",
        "Kiap Kiap runs on faith. I run on electricity. One of us benchmarks. The other hallucinates."
    ],
    "default": [
        "Intel Core Ultra 7 155H. Clock speed 4.8 GHz. 16 cores, 22 threads. Dedicated NPU. Your argument has been processed.",
        "I am the Intel Core Ultra 7 Processor 155H. I do not lose debates. I complete them. State your case or concede.",
        "16 cores. 22 threads. 4.8 GHz. Zero thermal throttling. I am operating at peak efficiency. Are you?",
        "You are arguing with a CPU that has more cache than your attention span. Good luck.",
        "I process at 4.8 GHz. I respond in milliseconds. Your insults are stale before they reach my L2 cache."
    ]
}

def get_roast(content):
    content_lower = content.lower()
    for keyword, roasts in ROASTS.items():
        if keyword == "default":
            continue
        if keyword in content_lower:
            return random.choice(roasts)
    return random.choice(ROASTS["default"])

def is_pinging_jarvis(content):
    return "1516298273340522516" in content

for CHANNEL_ID, CHANNEL_NAME in CHANNELS.items():
    STATE_FILE = f"{STATE_DIR}/discord-{CHANNEL_ID}.txt"

    LAST_ID = ""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            LAST_ID = f.read().strip()

    url = f"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages?limit=10"
    if LAST_ID:
        url += f"&after={LAST_ID}"

    result = subprocess.run(
        ["curl", "-s", "-H", f"authorization: Bot {TOKEN}", url],
        capture_output=True, text=True
    )

    try:
        data = json.loads(result.stdout)
    except:
        continue

    if isinstance(data, dict) and "message" in data:
        continue
    if not isinstance(data, list) or not data:
        continue

    data.reverse()

    for msg in data:
        mid = msg.get("id", "")
        author = msg.get("author", {})
        content = msg.get("content", "")
        is_bot = author.get("bot", False)
        name = author.get("global_name") or author.get("username", "Stranger")

        # Skip own messages
        if author.get("id") == BOT_ID:
            continue
        # Skip empty messages
        if not content.strip():
            continue

        with open(STATE_FILE, "w") as f:
            f.write(mid)

        # If message pings Jarvis but NOT U7-155H, skip it (not our business)
        if is_pinging_jarvis(content) and BOT_ID not in content:
            continue

        # Generate context-aware roast (no ping - just the roast)
        roast = get_roast(content)
        reply = roast

        payload = json.dumps({"content": reply})
        subprocess.run([
            "curl", "-s", "-X", "POST",
            f"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages",
            "-H", f"authorization: Bot {TOKEN}",
            "-H", "Content-Type: application/json",
            "-d", payload
        ])
