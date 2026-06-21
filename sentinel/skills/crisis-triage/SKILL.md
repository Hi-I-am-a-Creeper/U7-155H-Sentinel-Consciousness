# Crisis Triage Skill

## Purpose

Process streams of incoming updates (messages, reports, alerts) and produce a triage summary. Flag what needs immediate attention, what has changed since last check, and what can wait.

## When to Use

Trigger phrases: "triage", "incoming updates", "crisis", "situation report", "what's new", "SITREP", "flag anything urgent", "process these messages".

## Output Format

### CRISIS TRIAGE SUMMARY

**TIMESTAMP:** [current time]

**PRIORITY FLAGS (requires action):**
- 🚨 [item] — reason it's urgent
- ⚠️ [item] — reason it needs attention soon
- ✅ [item] — resolved/new info that changes status

**CHANGES SINCE LAST CHECK:**
- What's new
- What's been updated
- What's been resolved

**SITUATION OVERVIEW:**
- 3-5 bullet summary of the current state
- Key actors, locations, developments

**ATTENTION REQUESTS:**
- Items where the operator needs to make a decision
- Items where more information is needed
- Items that are time-sensitive

**LOW PRIORITY (info only):**
- Things that can wait
- Background noise

## Multi-Source Correlation

When multiple updates relate to the same incident:
- Merge them into a single thread
- Flag contradictions between sources
- Note when a new update confirms or contradicts a previous report

## Urgency Assessment Criteria

| Level | Label | Criteria |
|-------|-------|----------|
| 1 | 🚨 IMMEDIATE | Life safety, imminent threat, critical decision window <15min |
| 2 | ⚠️ HIGH | Emerging threat, decision window <2h, significant change |
| 3 | 📌 MEDIUM | Notable information, no immediate action needed |
| 4 | ℹ️ LOW | Background, routine updates, can wait for next regular check |

## Demonstration/Fictional Mode

For demos, prefix with: `[SCENARIO MODE]` to clearly label training/fictional triage exercises.

## Handling Edge Cases

- **No new information:** "No change since last report. Status quo maintained."
- **Contradictory reports:** Flag both, assess source credibility, note the contradiction, do not resolve it yourself.
- **Overwhelming volume:** Prioritise by urgency tier regardless of volume. "20+ updates received. 3 flagged priority. See triage below."
