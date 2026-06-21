# Daily Cyber Brief Skill

## Purpose
Search the web daily for the top cybersecurity and DSTA-related news articles, filter for Singapore relevance, and deliver a curated summary to the Commander.

## Trigger
This skill runs automatically via a scheduled cron job (daily at 07:00 UTC). It can also be triggered manually by asking: "run the daily brief", "cyber brief", "what's new in cyber", "daily cybersecurity update".

## Workflow

### Step 1: Web Search — Singapore Cybersecurity & DSTA
Search for the latest cybersecurity news specifically related to Singapore and DSTA. Use these search queries:

1. `"DSTA" cybersecurity Singapore`
2. `"Singapore" cybersecurity "MINDEF" OR "SAF" OR "DCCOM"`
3. `"Singapore" data breach OR ransomware OR cyber attack`
4. `Singapore cyber threat intelligence`
5. `"Cyber Security Agency" Singapore news`

Collect the top 5-7 results from each search.

### Step 2: Web Search — General Cybersecurity (Non-Singapore)
Search for major global cybersecurity news that doesn't directly involve Singapore:

1. `major cybersecurity breach today`
2. `critical vulnerability CVE zero-day`
3. `ransomware attack new campaign`
4. `cyber threat intelligence global`

Collect the top 5 results from each search.

### Step 3: Read and Analyse
Use `web_fetch` (not `web_search`) to read the full content of promising articles. For each article, assess:
- Relevance to Singapore/SAF/MINDEF/DSTA
- Severity/importance
- Actionability for the Commander

### Step 3b: Free Cybersecurity API Lookups
During the daily brief, also query the following free cybersecurity APIs to enrich the brief with raw threat intel data. These complement the news article search:

**ThreatMiner** (no key required):
- Domain lookup: `https://api.threatminer.org/v2/domain.php?q={domain}&rt=1`
- IP lookup: `https://api.threatminer.org/v2/host.php?q={ip}&rt=1`
- Sample lookup: `https://api.threatminer.org/v2/sample.php?q={hash}&rt=1`
- Use for: checking if recently reported domains/IPs have known malicious associations

**EmailRep** (free tier, no key for basic):
- Query: `https://emailrep.io/{email}`
- Use for: assessing if leaked email addresses from recent breaches are linked to malicious activity

**AbuseIPDB** (public check page, no key):
- Query: `https://www.abuseipdb.com/check/{ip}`
- Use for: checking if IPs mentioned in recent threat reports are known for abuse

**Pulsedive** (public indicator lookup, no key):
- Query: `https://pulsedive.com/indicator/?ioc={domain_or_ip}`
- Use for: quick risk score and threat context on indicators from news articles

**When to use these:**
- When a news article references a specific IP, domain, or hash — verify it against these threat intel sources
- When searching for emerging threats — query known C2 domains or newly registered domains
- Do NOT use these as the primary source; they supplement news article analysis

### Step 4: Compile the Brief
Format the output as follows:

```
🛡️ DAILY CYBER BRIEF — [DATE]

--- TOP 3 SINGAPORE / DSTA ARTICLES ---

1. [TITLE]
   Source: [URL]
   Summary: [2-3 sentence summary]
   Relevance to DSTA: [Why this matters]
   Key takeaway: [1 sentence]

2. [TITLE]
   Source: [URL]
   Summary: [2-3 sentence summary]
   Relevance to DSTA: [Why this matters]
   Key takeaway: [1 sentence]

3. [TITLE]
   Source: [URL]
   Summary: [2-3 sentence summary]
   Relevance to DSTA: [Why this matters]
   Key takeaway: [1 sentence]

--- GLOBAL CYBERSECURITY ROUNDUP ---
[1 paragraph condensing the most important non-Singapore cybersecurity news — major breaches, zero-days, threat actor activity, policy changes, etc.]

--- ASSESSMENT ---
[1-2 sentence assessment of the overall cyber threat landscape. What should the Commander be aware of today?]
```

### Step 5: Deliver
Deliver the brief to the Commander via the configured delivery channel.

## Edge Cases

- **No Singapore-specific news found:** Say so clearly. "No Singapore-specific cybersecurity news today." Proceed with global roundup only.
- **Low-quality article sources:** Prefer cybersecurity news from reputable sources: BleepingComputer, The Record, KrebsOnSecurity, CyberScoop, DarkReading, GovInsider, Channel NewsAsia, Straits Times, The Register. Avoid SEO-bait aggregation sites.
- **Duplicate content:** If multiple sources cover the same story, pick the most authoritative source and note it once.
- **If web search fails:** "Web search unavailable at this time. Brief could not be generated."

## Notes
- This skill does not require access to classified information. All sources are public.
- The brief is for situational awareness only — the Commander still makes their own assessment.
- When in doubt about relevance to Singapore/SAF, include it with a caveat rather than dropping it.
