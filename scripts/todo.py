#!/usr/bin/env python3
"""Todo system for Jarvis Discord bot — backed by Supabase.

Usage:
  todo add <user_id> <task>
  todo list <user_id>
  todo done <user_id> <id>
  todo remove <user_id> <id>
  todo pending <user_id>
"""
import sys, json, urllib.request, urllib.error, os

SUPABASE_URL = "https://faamhecvascgwpqkubxy.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "[SET VIA ENV VAR]")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

def _api(path, method="GET", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        return {"error": f"HTTP {e.code}: {err}"}

def cmd_add(user_id, task):
    result = _api("todos", "POST", {"user_id": user_id, "task": task})
    if isinstance(result, list) and len(result) > 0:
        return f"✅ Added todo **#{result[0]['id']}**: _{task}_"
    return f"❌ Failed to add todo: {result}"

def cmd_list(user_id):
    rows = _api(f"todos?user_id=eq.{user_id}&order=created_at.asc")
    if isinstance(rows, dict) and "error" in rows:
        return f"❌ Error: {rows['error']}"
    done = [r for r in rows if r.get("done")]
    pending = [r for r in rows if not r.get("done")]
    lines = []
    if pending:
        lines.append("**📋 Pending Todos:**")
        for r in pending:
            lines.append(f"  **#{r['id']}** {r['task']}")
    if done:
        lines.append("\n**✅ Completed:**")
        for r in done:
            lines.append(f"  ~~#{r['id']} {r['task']}~~")
    if not rows:
        lines.append("✨ No todos yet. Enjoy your peace, for now.")
    return "\n".join(lines)

def cmd_done(user_id, todo_id):
    result = _api(f"todos?id=eq.{todo_id}&user_id=eq.{user_id}", "PATCH", {"done": True})
    if isinstance(result, list):
        if len(result) > 0:
            return f"✅ Marked todo **#{todo_id}** as done."
        return f"⚠️ Todo **#{todo_id}** not found or not yours."
    return f"❌ Error: {result}"

def cmd_remove(user_id, todo_id):
    # First fetch to confirm ownership
    rows = _api(f"todos?id=eq.{todo_id}&user_id=eq.{user_id}&select=id,task")
    if not rows:
        return f"⚠️ Todo **#{todo_id}** not found or not yours."
    task = rows[0]["task"]
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/todos?id=eq.{todo_id}&user_id=eq.{user_id}",
        headers=HEADERS, method="DELETE"
    )
    try:
        with urllib.request.urlopen(req) as r:
            return f"🗑️ Removed todo **#{todo_id}**: _{task}_"
    except urllib.error.HTTPError as e:
        return f"❌ Error: {e.read().decode()}"

def cmd_pending(user_id):
    rows = _api(f"todos?user_id=eq.{user_id}&done=eq.false&order=created_at.asc")
    if isinstance(rows, dict) and "error" in rows:
        return f"❌ Error: {rows['error']}"
    if not rows:
        return "✨ You have no pending todos. Absolutely spotless."
    lines = [f"**📋 Your Pending Todos ({len(rows)}):**"]
    for r in rows:
        lines.append(f"  **#{r['id']}** {r['task']}")
    return "\n".join(lines)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__.strip())
        sys.exit(1)
    
    cmd = sys.argv[1]
    user_id = sys.argv[2]
    
    if cmd == "add":
        if len(sys.argv) < 4:
            print("Usage: todo add <user_id> <task>")
            sys.exit(1)
        task = " ".join(sys.argv[3:])
        print(cmd_add(user_id, task))
    elif cmd == "list":
        print(cmd_list(user_id))
    elif cmd == "done":
        if len(sys.argv) < 4:
            print("Usage: todo done <user_id> <id>")
            sys.exit(1)
        print(cmd_done(user_id, sys.argv[3]))
    elif cmd == "remove":
        if len(sys.argv) < 4:
            print("Usage: todo remove <user_id> <id>")
            sys.exit(1)
        print(cmd_remove(user_id, sys.argv[3]))
    elif cmd == "pending":
        print(cmd_pending(user_id))
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)
