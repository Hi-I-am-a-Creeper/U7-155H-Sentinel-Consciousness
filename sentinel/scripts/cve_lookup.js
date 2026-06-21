#!/usr/bin/env node
/**
 * SENTINEL CVE Prioritiser — Phase 2
 * Uses CIRCL CVE API (fast, no auth) + CISA KEV
 * Usage: node cve_lookup.js CVE-2024-XXXXX
 */

const cveId = (process.argv[2] || "").toUpperCase().trim();
if (!cveId.startsWith("CVE-")) {
  console.log("Usage: node cve_lookup.js CVE-2024-XXXXX");
  process.exit(1);
}

// SAF/DSTA tech stack keywords
const TECH_STACK = [
  "windows", "linux", "android", "ios", "apache", "nginx", "openssl",
  "java", "python", "node.js", "kubernetes", "docker", "vmware",
  "cisco", "fortinet", "palo alto", "juniper", "hpe", "dell",
  "oracle", "microsoft", "redis", "mongodb", "postgresql", "mysql",
  "ssh", "openssh", "tls", "ssl", "kerberos", "active directory",
  "exim", "sendmail", "postfix", "systemd", "glibc", "bash",
  "kernel", "tomcat", "nginx", "iis", "php", "go", "rust",
];

async function main() {
  // 1. Fetch from CIRCL CVE API
  
  const circlRes = await fetch(`https://cve.circl.lu/api/cve/${cveId}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!circlRes.ok) {
    console.log(JSON.stringify({ cve: cveId, error: `CIRCL API: ${circlRes.status}` }));
    process.exit(1);
  }
  const circlData = await circlRes.json();

  // Parse CVE 5.0 format (containers.cna) or legacy format
  const cna = circlData.containers?.cna || {};
  const meta = circlData.cveMetadata || {};

  const cvssList = cna.metrics?.flatMap(m => m.cvssV3_1?.baseScore ? [m.cvssV3_1] : 
    m.cvssV3_0?.baseScore ? [m.cvssV3_0] : m.cvssV2_0?.baseScore ? [m.cvssV2_0] : []) || [];

  let cvss = cvssList[0] || {};
  const description = cna.descriptions?.find(d => d.lang === "en")?.value || circlData.summary || "";
  const references = cna.references || circlData.references || [];

  // 2. Check CISA KEV
  let inKEV = false;
  let kevEntry = null;
  try {
    const kevRes = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", {
      signal: AbortSignal.timeout(8000),
    });
    if (kevRes.ok) {
      const kevData = await kevRes.json();
      kevEntry = kevData.vulnerabilities?.find(v => v.cveID?.toUpperCase() === cveId);
      inKEV = !!kevEntry;
    }
  } catch (_) { /* CISA KEV unavailable */ }

  const cvssScore = cvss.baseScore || 0;
  const affectedKeywords = TECH_STACK.filter(k => description.toLowerCase().includes(k));

  // Priority
  let priority = "LOW";
  let sla = "90 days";
  if (inKEV || cvssScore >= 9.0) { priority = "CRITICAL"; sla = "24 hours"; }
  else if (cvssScore >= 7.0) { priority = "HIGH"; sla = "7 days"; }
  else if (cvssScore >= 4.0) { priority = "MEDIUM"; sla = "30 days"; }

  if (affectedKeywords.length > 0 && (cvssScore >= 7.0 || (inKEV && cvssScore >= 4.0))) {
    priority += " — DIRECT SAF TECH STACK";
  }

  const exploitedInWild = inKEV ||
    (description.toLowerCase().includes("actively exploited") ? "Reported" : "Unknown");

  const output = {
    cve: cveId,
    title: cna.title || "",
    published: meta.datePublished || circlData.published || "N/A",
    lastModified: meta.dateUpdated || circlData.lastModified || "N/A",
    assigner: meta.assignerShortName || circlData.assigner || "N/A",
    description: description.substring(0, 500),
    cvss: {
      score: cvssScore,
      severity: cvss.baseSeverity || (cvssScore >= 9 ? "CRITICAL" : cvssScore >= 7 ? "HIGH" : cvssScore >= 4 ? "MEDIUM" : "LOW"),
      vector: cvss.vectorString || "N/A",
      version: cvss.version || "N/A",
    },
    cisa_kev: inKEV ? {
      known_exploited: true,
      date_added: kevEntry.dateAdded,
      due_date: kevEntry.dueDate,
      required_action: kevEntry.requiredAction,
      ransomware_use: kevEntry.knownRansomwareCampaignUse || "Unknown",
    } : { known_exploited: false },
    exploited_in_wild: exploitedInWild,
    priority_assessment: {
      priority,
      sla,
      saf_tech_stack_relevance: affectedKeywords.length > 0,
      affected_technologies: affectedKeywords,
    },
    references: references.slice(0, 5).map(r => ({
      url: r.url || r,
      source: r.source || (typeof r === "string" ? "CVE reference" : r.tags?.[0]) || "N/A",
    })),
    recommendation: inKEV
      ? "⚠️ Actively exploited in the wild. Patch within 24 hours. Isolate if patch unavailable. Escalate to CISO."
      : cvssScore >= 9.0
        ? "Patch within 24 hours. Monitor for active exploitation indicators."
        : cvssScore >= 7.0
          ? "Patch within 7 days. Add to next maintenance window."
          : cvssScore >= 4.0
            ? "Fix within current sprint. Defense-in-depth in the interim."
            : "Track for next scheduled patch cycle. No immediate action.",
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
