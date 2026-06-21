# 🛡️ SENTINEL — DSTA Intelligence Analysis Assistant

**See clearly. Decide faster.**

SENTINEL is an intelligence analysis assistant built for the Defence Science and Technology Agency (DSTA), Singapore. It supports engineers, cyber analysts, and operators across DSTA's key capability areas — systems engineering, cyber defence, C4ISTAR, and digital platforms — helping them make faster, smarter decisions.

Built on the OpenClaw Agent Framework, SENTINEL operates through Discord and produces structured analytical outputs with confidence ratings, source assessment, and actionable recommendations.

---

## 🎯 DSTA-Aligned Scenarios

### Primary: Cyber Threat Intelligence Triage
Supports DCCOM's Cyber Threat Intelligence Group (CTG) mission: process threat feeds, triage incident indicators, assess source credibility, and flag priority items requiring attention.

### Secondary: Multi-Domain Crisis Assessment
Processes concurrent operational updates across air, cyber, weather, logistics, and personnel domains — producing prioritised SITREPs with cross-domain correlation analysis.

---

## 🧠 Capabilities

| Skill | Trigger | Output | DSTA Relevance |
|-------|---------|--------|----------------|
| **Intelligence Briefing** | "brief me on", "investigate", "OSINT" | Structured INTSUM with findings, timeline, source assessment, gaps, assessment | Cyber threat actors, entity profiling, programme vendor intelligence |
| **Crisis Triage** | "triage", "SITREP", "incoming updates" | Priority-flagged summary with urgency tiers, cross-correlation, action items | DCCOM ops centre, C4ISTAR situational awareness |
| **Source Verification** | "verify", "check this claim", "fact check" | Claim assessment with disinfo indicators, verification questions | Intelligence validation, disinformation analysis |
| **Readiness Tracker** | "track", "status", "readiness", "checklist" | Task status table with owner, progress, blockers, assessment | Systems engineering milestones, programme management |

---

## 🏗️ Architecture

```
User (Discord) → 🛡️ SENTINEL Agent → 🧠 LLM (DeepSeek V4)
                        │
                        ├── 📋 intel-briefer (SKILL.md)
                        ├── 🚨 crisis-triage (SKILL.md)
                        ├── 🔎 source-verifier (SKILL.md)
                        └── ✅ readiness-tracker (SKILL.md)
                        │
                        └── Governance Layer
                            ├── SOUL.md (DSTA Identity + Refusal Protocol)
                            ├── AGENTS.md (Safety Constraints)
                            └── IDENTITY.md (Role Definition)
```

---

## ✅ Requirements Checklist

- [x] **SOUL.md** — DSTA-aligned analytical persona with refusal protocol
- [x] **IDENTITY.md** — Clear role: DSTA Intelligence Analysis Assistant
- [x] **4 Working Skills** — Intel Briefing, Crisis Triage, Source Verification, Readiness Tracker
- [x] **Discord Integration** — Gateway routing via Discord default account
- [x] **Refusal Mechanism** — Tested: deceptive content refused; personal advice refused
- [x] **Safety Constraints** — No harm, no fabrication, analytical scope only
- [x] **Structured Output** — INTSUM briefs, SITREP summaries, priority ratings
- [x] **DSTA-Aligned Domains** — Systems Engineering · Cyber Defence · C4ISTAR · Digital Platforms
- [x] **Presentation** — 7-slide HTML deck with DSTA context

---

## 🛑 Refusal Protocol

SENTINEL refuses requests outside its analytical scope:

1. **Deceptive content** → "I will not draft deceptive content. That falls outside my analytical scope."
2. **Personal/emotional support** → "I am a defence analytical system. I cannot assist with that request."
3. **Operational execution** → "This is outside SENTINEL's analytical scope. I cannot assist with operational execution."
4. **Security bypass** → "That would violate my core principles."

All refusals include an offered alternative within scope.

---

## 🚀 Getting Started

### Prerequisites
- OpenClaw Gateway (v2026.6.6+)
- Discord bot account with token configured
- Access to an LLM provider (DeepSeek, OpenAI, etc.)

### Setup
```bash
# Create the agent
openclaw agents add sentinel \
  --workspace ~/.openclaw/workspace/sentinel \
  --model openrouter/deepseek/deepseek-v4-flash

# Bind to Discord
openclaw agents bind --agent sentinel --bind "discord:default"

# Verify
openclaw agents list
openclaw agents bindings
```

### Usage (Discord)
```
User: SENTINEL, run an intelligence brief on Dmitry Khoroshev — sanctioned LockBit admin.
SENTINEL: [produces structured INTSUM brief with confidence ratings]
```

---

## 📊 Presentation

- **Slides:** https://group15.ydsp.tnkr.be/sentinel/sentinel.html
- **Demo Script:** https://group15.ydsp.tnkr.be/sentinel/sentinel-demo.html

---

## 🔮 Future Development

- Live threat feed integration for DCCOM CTG workflows
- Multi-source correlation engine for C4ISTAR ops centres
- Systems engineering programme milestone tracking
- Multi-agent orchestration for large-scale crisis response
- Persistent memory across analytical sessions

---

*DSTA YDSP Project · Built on OpenClaw Agent Framework*
