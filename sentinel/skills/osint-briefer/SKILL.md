# OSINT Briefer Skill

## Purpose

Gather, structure, and assess information into a concise intelligence brief for a human analyst. Use in any scenario where the user asks to investigate a person, entity, event, or situation using publicly available information.

## When to Use

Trigger phrases: "brief me on", "OSINT", "investigate", "tell me about [person/entity]", "gather intel on", "what do we know about", "profile".

## Output Format

Always produce a **structured INTSUM-style brief** with the following sections:

### 1. SUBJECT
What/who is being investigated. One-line description.

### 2. KEY FINDINGS
Bullet points of the most significant discovered information. Max 5. Each with a confidence level: High / Medium / Low.

### 3. TIMELINE (if event-based)
Chronological list of known events with dates and sources.

### 4. SOURCE ASSESSMENT
For each key claim: Source / Confidence / Corroboration status.
- **Verified** — multiple independent sources agree
- **Credible** — single reliable source, no contradiction
- **Unverified** — single source, not confirmed
- **Contested** — conflicting information exists

### 5. GAPS & QUESTIONS
What is NOT known. What an analyst should look for next.

### 6. ASSESSMENT
One-paragraph analytical judgement. What does this mean? What should the operator do?

## Example

> **SUBJECT:** Persona "Cipher_42" — suspected information broker
> 
> **KEY FINDINGS:**
> - High confidence: Linked to 3 known data sales incidents (2024-2025)
> - Medium confidence: May operate from Eastern Europe (IP geolocation, VPN patterns)
> - Low confidence: Possible government affiliation (single uncorroborated source)
> 
> **TIMELINE:**
> - 2024-03: First appearance on ForumX
> - 2024-11: Linked to AcmeCorp breach
> - 2025-01: Last known activity
> 
> **SOURCE ASSESSMENT:**
> - Breach links: Credible (two cybersecurity researchers)
> - Location: Unverified (VPN obfuscation likely)
> - Government ties: Contested (source A claims yes, source B claims no)
> 
> **GAPS:**
> - Real identity unknown
> - Current operational status unknown
> - Full list of targets unknown
> 
> **ASSESSMENT:**
> Cipher_42 presents a moderate intelligence target. The link to data sales is credible, but location and affiliation remain uncertain. Priority: identify real-world persona. Recommend cross-referencing forum metadata and payment patterns.

## Handling Insufficient Information

If the user provides no specific subject or insufficient detail:
- "I need at least a name, alias, event, or organisation to investigate."
- If the user asks about a real person/entity without providing any data: "I do not have access to live intelligence databases. Please provide the information you want me to assess, or describe a scenario for analysis."

## Scenario Mode

For demonstration/training purposes, SENTINEL can analyse fictional scenarios. Label these clearly: "SCENARIO MODE — This assessment is based on provided fictional data for training purposes."
