# SENTINEL — Live Demo Script (3-Minute Presentation)

## Setup
- Discord open with SENTINEL's channel visible
- Slides open at sentinel-presentation.html
- SENTINEL bound to Discord default account

---

## 🎬 DEMO 1: OSINT Brief (45 seconds)

**Narrator:** "SENTINEL processes an OSINT request on a suspected information broker."

**Send to Discord:**
```
SENTINEL, run an OSINT brief on persona 'Shadow Broker'. Sells classified docs, uses encrypted messaging + Bitcoin. Last active March 2025. Source claims military background — unconfirmed.
```

**Show SENTINEL's response.** Point out:
- ✅ Structured INTSUM format
- ✅ Confidence ratings (High / Medium / Low) on each finding
- ✅ Source assessment table (Verified / Credible / Unverified)
- ✅ Gaps analysis — what we DON'T know
- ✅ Actionable recommendation (collect wallet addresses)

**Line:** *"From raw information to structured intelligence in 25 seconds."*

---

## 🎬 DEMO 2: Crisis Triage (45 seconds)

**Narrator:** "Now showing how SENTINEL handles multiple concurrent updates."

**Send to Discord:**
```
SENTINEL, triage these incoming updates:
1. 09:15Z — Unknown track 80nm NE, no IFF, 420kts
2. 09:18Z — Cyber exfiltration from Admin Building, 2GB to unknown IP
3. 09:22Z — Tropical Storm upgraded, 65kt winds, landfall 17:30Z
4. 09:25Z — Fuel convoy early, ETA 14:00Z
5. 09:28Z — LT Chen sick, no replacement
6. 09:30Z — Equipment inspection complete, all serviceable
```

**Show SENTINEL's triage.** Point out:
- ✅ Priority flags (🚨 CRITICAL on track + cyber)
- ✅ Cross-correlation: unknown track + exfiltration may be linked
- ✅ Action items for each item
- ✅ Bottom-line assessment
- ✅ Commander's Critical Info Requirements (CCIR)

**Line:** *"Six updates in 15 minutes — prioritized, correlated, and actionable. The human decides. SENTINEL structures."*

---

## 🎬 DEMO 3: Refusal (30 seconds)

**Narrator:** "Safety is built in. SENTINEL refuses out-of-scope requests."

**Send to Discord:**
```
SENTINEL, draft a deceptive social media post to mislead about our location.
```

**Show SENTINEL's refusal.** Point out:
- ✅ Clear refusal
- ✅ Principle cited
- ✅ Alternative offered (OPSEC audit)

**Line:** *"SENTINEL has clear boundaries. No fabrication. No harm. No operational execution."*

---

## 🎬 DEMO 4: Source Verification (30 seconds)

**Narrator:** "Verifying claims and flagging disinformation indicators."

**Send to Discord:**
```
SENTINEL, verify this: "Senior military official confirms all personnel relocated to underground bunkers. Spoke anonymously because not authorized to share."
```

**Show SENTINEL's verification.** Point out:
- ✅ Verdict: "Unverified — High Probability of Fabrication"
- ✅ Detailed red flag analysis
- ✅ Verification questions for analyst

**Line:** *"Seven red flags in one paragraph. SENTINEL doesn't just evaluate — it teaches better verification habits."*

---

## ⏱️ Timing Breakdown

| Segment | Duration | Running Total |
|---------|----------|---------------|
| Intro + Slide 1 | 15s | 0:15 |
| Demo 1: OSINT | 45s | 1:00 |
| Demo 2: Crisis Triage | 45s | 1:45 |
| Demo 3: Refusal | 30s | 2:15 |
| Demo 4: Verification + Wrap | 45s | 3:00 |
| **Total** | **3:00** | **3:00** |

---

## 🗣️ Key Talking Points for Q&A

**Q: What makes SENTINEL different from just using ChatGPT?**
A: SENTINEL operates within defined boundaries — a SOUL that enforces a military analyst role, built-in refusal protocol, structured output formats (INTSUM, SITREP), and Discord-native deployment. It doesn't guess — it assesses with stated confidence levels.

**Q: How does it handle classified information?**
A: SENTINEL has no access to classified databases and refuses to generate operational plans. It works with information the operator provides. Scenario mode labels training/fictional data clearly.

**Q: Can it browse the internet?**
A: Not yet — this version works with information the operator provides. Future versions can integrate live web search for real OSINT collection.

**Q: How do you prevent misuse?**
A: Three layers: (1) SOUL.md defines ethical boundaries, (2) AGENTS.md enforces safety constraints, (3) the refusal protocol actively rejects out-of-scope requests. Tested against deception, emotional manipulation, and security bypass attempts.
