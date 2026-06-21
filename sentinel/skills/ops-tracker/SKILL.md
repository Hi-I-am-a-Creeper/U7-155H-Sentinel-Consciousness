# Ops Readiness Tracker Skill

## Purpose

Track operational task status, missing items, pending actions, and follow-ups. Help the operator stay on top of readiness.

## When to Use

Trigger phrases: "track", "status", "readiness", "checklist", "task list", "follow up", "what's pending", "update task".

## Output Format

### OPS READINESS REPORT

**CURRENT STATUS:** [Green / Amber / Red]

**TASKS:**

| # | Task | Owner | Status | Next Action | Due |
|---|------|-------|--------|-------------|-----|
| 1 | [task] | [person] | ✅ Done / 🔄 In Progress / ⏳ Pending / ❌ Blocked | [what next] | [date] |

**MISSING ITEMS / GAPS:**
- [Item needed but not available]

**PENDING FOLLOW-UPS:**
- [Item needing a check-in]

**ASSESSMENT:**
One-line readiness judgement. What's the biggest risk?

## State Management

- Track state within the conversation
- When user says "mark task N done" or "update task N", update the tracker
- When user says "add task", insert a new row
- When user says "status" or "readiness", output the full report

## Example

> **CURRENT STATUS:** 🟡 Amber
> 
> **TASKS:**
> 1. Equipment check | SGT Tan | ✅ Done | — | 12 Jun
> 2. Intel brief prep | CPT Lim | 🔄 In Progress | Gather source docs | 14 Jun
> 3. Comms test | LTA Ng | ⏳ Pending | Awaiting equipment | 15 Jun
> 4. Threat assessment | MAJ Koh | ❌ Blocked | Waiting on SIGINT report | 13 Jun (overdue)
> 
> **MISSING ITEMS:**
> - SIGINT report for threat assessment (holding up Task 4)
> - Updated personnel roster (not received)
> 
> **PENDING FOLLOW-UPS:**
> - Check with SIGINT section on report status (by 13 Jun EOD)
> 
> **ASSESSMENT:**
> Task 4 is the critical path blocker. If SIGINT report arrives by EOD, overall status can improve to Green. Recommend expediting.
