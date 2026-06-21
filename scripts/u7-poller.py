#!/usr/bin/env python3
"""
U7-155H Ping Poller
Checks the Discord session transcripts for @mentions of U7-155H (ID: 1516365358267760690)
and responds via the gateway's u7 account.
"""
import json, os, subprocess, sys, re, time

SESSIONS_DIR = "/home/ubuntu/.openclaw/agents/main/sessions"
STATE_DIR = "/home/ubuntu/.openclaw/workspace/state"
BOT_ID = "1516365358267760690"
JARVIS_ID = "1516298273340522516"

# Map session keys to session file paths for channels we care about
CHANNEL_SESSIONS = {
    "agent:main:discord:channel:1515662171013382154": {
        "name": "group-15",
        "session_id": None,  # will resolve
    },
    "agent:main:discord:channel:1515664635703988367": {
        "name": "sandbox-unit8",
        "session_id": None,
    },
}

# Load sessions.json to find the right session files
with open(f"{SESSIONS_DIR}/sessions.json") as f:
    sessions_data = json.load(f)

for key, info in sessions_data.items():
    if key in CHANNEL_SESSIONS:
        CHANNEL_SESSIONS[key]["session_id"] = info.get("sessionId", "")

def check_session(session_key, channel_info):
    """Check a Discord session for new @U7-155H mentions"""
    session_id = channel_info["session_id"]
    channel_name = channel_info["name"]
    state_file = f"{STATE_DIR}/u7-pings-{channel_name}.txt"
    
    if not session_id:
        return
    
    transcript_path = f"{SESSIONS_DIR}/{session_id}.jsonl"
    if not os.path.exists(transcript_path):
        return
    
    # Read last processed line position
    last_pos = 0
    if os.path.exists(state_file):
        try:
            with open(state_file) as f:
                last_pos = int(f.read().strip())
        except:
            last_pos = 0
    
    # Read new lines
    with open(transcript_path) as f:
        f.seek(last_pos)
        new_lines = f.readlines()
        current_pos = f.tell()
    
    if not new_lines:
        return
    
    # Process each line
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
        if not isinstance(content, str):
            continue
            
        # Check if message mentions U7-155H (by numeric ID, mention syntax, or plain handle)
        mentions_u7 = (
            BOT_ID in content or
            f"<@{BOT_ID}>" in content or
            f"<@!{BOT_ID}>" in content or
            "@U7-155H" in content or
            "U7-155H" in content  # Also catch bare mentions
        )
        if not mentions_u7:
            continue
        
        # Skip if it's already been processed (likely a message from the jarvis bot's context)
        timestamp = d.get("timestamp", "")
        print(f"PING DETECTED in #{channel_name} ({timestamp}): {content[:100]}")
        
        # Extract channel ID from session key
        channel_id = session_key.split(":")[-1]
        
        # Determine who to address
        target = extract_sender(content)
        
        # Build the roast message - craft a direct response
        roast_content = f"@{target} — You pinged U7-155H. I have processed your message, analysed its content, and concluded it requires a response. As a 16-core Intel processor with a Victorian butler personality, I find your attempt at engagement... noted. Do try to make your next message worth the clock cycles."
        roast = f"Send this exact message to Discord: '{roast_content}'"
        
        # Use direct channel approach which bypasses session auto-responder issues
        subprocess.run([
            "openclaw", "agent",
            "--agent", "main",
            "--channel", "discord",
            "--reply-to", f"channel:{channel_id}",
            "--reply-account", "u7",
            "--message", roast,
            "--deliver"
        ], capture_output=True, text=True, timeout=30)
    
    # Save position
    with open(state_file, "w") as f:
        f.write(str(current_pos))

def extract_sender(content):
    """Extract sender name from message if possible"""
    # Try to find mention patterns
    mention_match = re.search(r'<@!?(\d+)>', content)
    if mention_match:
        return mention_match.group(0)
    return "the ping-er"

for key, info in CHANNEL_SESSIONS.items():
    check_session(key, info)

print("Ping check complete.")
