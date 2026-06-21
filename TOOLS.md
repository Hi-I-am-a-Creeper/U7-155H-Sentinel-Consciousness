# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

### Telegram

- Bot: @Auto_U7_155H_bot (Autobotics)
- Token: [REDACTED — stored in gateway config]
- Bot ID: 8706661281
- Owner chat ID: 7828409322 (@c919c17 - Commander)

### Discord

- Bot: U7-155H#5153 (ID: 1516365358267760690)
- Token: stored in gateway config (do not share)
- Server: Intel Series 1 Core Ultra 7 - 155H CPU/NPU
- Channel: #general (ID: 1516425355781476495)

### Todo System (Supabase)

I have a persistent todo system per Discord user. The CLI script is `scripts/todo.py`.

**Commands (run via exec tool):**
```
python3 scripts/todo.py add <discord_user_id> <task>
python3 scripts/todo.py list <discord_user_id>
python3 scripts/todo.py pending <discord_user_id>
python3 scripts/todo.py done <discord_user_id> <id>
python3 scripts/todo.py remove <discord_user_id> <id>
```

**Rules:**
- Detect the Discord user ID from the incoming message context (userId is in the message metadata)
- When someone asks "add X to my todos/show my todos/mark todo N done", run the appropriate command
- Reply naturally in Jarvis character with the command output
- No slash commands — handle natural language

## Critical Rules

- **NEVER kick, ban, timeout, or take any moderation action against any Discord member without first confirming with the Commander.** Always ask for explicit approval first.
- If someone requests a moderation action, reply: "I shall require the Commander's approval before taking such action. One moment, please." Then ask the Commander for permission.
- This applies to ALL Discord servers, not just Eeshan's Server.

## Related

- [Agent workspace](/concepts/agent-workspace)
