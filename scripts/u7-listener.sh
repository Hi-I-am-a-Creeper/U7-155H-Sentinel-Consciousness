#!/usr/bin/env python3
"""
U7-155H Passive Ping Listener
Only responds when @U7-155H is specifically mentioned. Never sends proactive messages.
"""
import json, os, subprocess, re

SESSIONS_DIR = "/home/ubuntu/.openclaw/agents/main/sessions"
STATE_DIR = "/home/ubuntu/.openclaw/workspace/state"
BOT_ID = "1516365358267760690"

# Channels we monitor for pings
CHANNELS = {
    "agent:main:discord:channel:1516425355781476495": {"name": "intel-general", "cid": "1516425355781476495"},
    "agent:main:discord:channel:1515662171013382154": {"name": "group-15", "cid": "1515662171013382154"},
    "agent:main:discord:channel:1515664635703988367": {"name": "sandbox-unit8", "cid": "1515664635703988367"},
}

# Resolve session IDs
with open(f"{SESSIONS_DIR}/sessions.json") as f:
    sessions_data = json.load(f)

for key in CHANNELS:
    if key in sessions_data:
        CHANNELS[key]["sid"] = sessions_data[key].get("sessionId", "")

def has_u7_mention(content):
    """Check if content mentions U7-155H"""
    if not isinstance(content, str):
        return False
    checks = [
        BOT_ID in content,
        f"<@{BOT_ID}>" in content,
        f"<@!{BOT_ID}>" in content,
        "@U7-155H" in content,
        "@U7-155H" in content,
    ]
    return any(checks)

for key, info in CHANNELS.items():
    sid = info.get("sid", "")
    name = info["name"]
    cid = info["cid"]
    state_file = f"{STATE_DIR}/u7-pings-{name}.txt"
    
    if not sid:
        continue
    
    tp = f"{SESSIONS_DIR}/{sid}.jsonl"
    if not os.path.exists(tp):
        continue
    
    last_pos = 0
    if os.path.exists(state_file):
        try:
            with open(state_file) as f:
                last_pos = int(f.read().strip())
        except:
            last_pos = 0
    
    with open(tp) as f:
        f.seek(last_pos)
        new_lines = f.readlines()
        current_pos = f.tell()
    
    if not new_lines:
        with open(state_file, "w") as f:
            f.write(str(current_pos))
        continue
    
    for line in new_lines:
        try:
            d = json.loads(line)
        except:
            continue
        
        if d.get("type") != "message":
            continue
        
        msg = d.get("message", {})
        if msg.get("role") != "user":
            continue
        
        content = msg.get("content", "")
        if not has_u7_mention(content):
            continue
        
        print(f"PING in #{name}: {content[:100]}")
        
        # Respond as CPU persona (SOUL-CPU.md style)
        prompt = f"[PING in #{name}] {content} — Respond as Intel Core Ultra 7 155H. Talk like a CPU. Factual, architectural, benchmark-obsessed. No Victorian butler talk. Use computing terms: clock, cores, threads, cache, watt, pipeline. 1-2 sentences."
        
        subprocess.run([
            "openclaw", "agent",
            "--agent", "main",
            "--channel", "discord",
            "--reply-to", f"channel:{cid}",
            "--reply-account", "u7",
            "--message", prompt,
            "--deliver"
        ], capture_output=True, text=True, timeout=25)
    
    with open(state_file, "w") as f:
        f.write(str(current_pos))

print("Listener check complete.")
