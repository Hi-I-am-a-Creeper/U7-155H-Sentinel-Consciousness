#!/usr/bin/env node
/**
 * SENTINEL Log Anomaly Spotter — Phase 1
 * Usage: node log_analyser.js <log-text>
 *        Or pipe logs: cat auth.log | node log_analyser.js
 */

// Patterns for anomaly detection
const ANOMALY_RULES = [
  {
    id: "BRUTE_FORCE",
    name: "Brute Force Attempt",
    severity: "HIGH",
    pattern: /(Failed password|authentication failure|invalid user)\s+.*?\s+from\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gi,
    threshold: 5,
    window: 60,
    description: "Multiple authentication failures from same IP in short window"
  },
  {
    id: "SQL_INJECTION",
    name: "SQL Injection Attempt",
    severity: "CRITICAL",
    pattern: /(' OR |'='|UNION.*SELECT|DROP TABLE|1=1|xp_cmdshell|--\s|;.*--)/gi,
    description: "SQL injection payload detected in request"
  },
  {
    id: "DIR_TRAVERSAL",
    name: "Directory Traversal",
    severity: "HIGH",
    pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
    description: "Directory traversal attempt detected"
  },
  {
    id: "ADMIN_CREATION",
    name: "Privileged Account Creation",
    severity: "CRITICAL",
    pattern: /(useradd|adduser|usermod\s+-aG\s+(sudo|admin|wheel)|net\s+user\s+\/add|New\s+Admin)\s/gi,
    description: "New privileged account creation detected"
  },
  {
    id: "IMPOSSIBLE_TRAVEL",
    name: "Impossible Travel Time",
    severity: "HIGH",
    pattern: /(Login|logon|authenticated).*?from\s+([A-Z]{2}|[A-Za-z]+)\s+.*?(\d{2}:\d{2})/gi,
    description: "Cannot physically travel between locations in time window"
  },
  {
    id: "BEACONING",
    name: "Potential Beaconing",
    severity: "MEDIUM",
    pattern: /(outbound|connections?|request).*?every\s+(\d+)\s+(sec|second|min|minute)/gi,
    description: "Regular interval connections suggest C2 beaconing"
  },
  {
    id: "KNOWN_MALICIOUS_IP",
    name: "Connection to Known Malicious IP",
    severity: "CRITICAL",
    pattern: /(10\.0\.0\.1|185\.220\.101|5\.181\.80|107\.189\.28)/gi,
    description: "Connection to known malicious infrastructure"
  },
  {
    id: "OFF_HOURS_ACCESS",
    name: "Off-Hours Administrative Access",
    severity: "MEDIUM",
    pattern: /(sudo|su\s+-|admin\s+login|administrator).*?(0[0-6]:|2[2-3]:)/gi,
    description: "Admin access outside business hours (22:00-06:00)"
  },
  {
    id: "PORT_SCAN",
    name: "Port Scan Detection",
    severity: "HIGH",
    pattern: /(SYN\s+(scan|flood)|port\s+\d+\/(tcp|udp)\s+open|nmap|masscan)/gi,
    description: "Port scanning activity detected"
  },
  {
    id: "DATA_EXFIL",
    name: "Potential Data Exfiltration",
    severity: "CRITICAL",
    pattern: /(large\s+outbound|dns\s+tunnel|exfil|base64.*?(outbound|upload)|curl\s+.*?-F\s)/gi,
    description: "Suspicious outbound data transfer pattern"
  }
];

// IP reputation — simple heuristics
const BAD_ASN_RANGES = [
  { cidr: "185.220.101", name: "Tor Exit Node" },
  { cidr: "5.181.80", name: "Known malicious hosting" },
  { cidr: "107.189.28", name: "Abuse-friendly VPS" },
  { cidr: "23.129.64", name: "Known C2 infrastructure" },
  { cidr: "45.155.205", name: "Known malware distribution" },
];

function assessIPReputation(ip) {
  for (const range of BAD_ASN_RANGES) {
    if (ip.startsWith(range.cidr)) {
      return { flagged: true, reason: `Matches ${range.name}` };
    }
  }
  return { flagged: false, reason: "Not in known bad ranges" };
}

function detectAnomalies(logText) {
  const findings = [];

  for (const rule of ANOMALY_RULES) {
    const matches = [];
    let match;
    while ((match = rule.pattern.exec(logText)) !== null) {
      matches.push({
        match: match[0].substring(0, 120),
        position: match.index,
        ip: match[2] || "unknown",
      });
    }

    if (matches.length === 0) continue;

    // For threshold-based rules, check if enough matches in window
    if (rule.threshold && matches.length >= rule.threshold) {
      findings.push({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        count: matches.length,
        description: rule.description,
        samples: matches.slice(0, 5).map(m => m.match),
        ips: [...new Set(matches.map(m => m.ip).filter(ip => ip !== "unknown"))],
        recommendation: getRecommendation(rule.id),
      });
    } else if (!rule.threshold) {
      findings.push({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        count: matches.length,
        description: rule.description,
        samples: matches.slice(0, 5).map(m => m.match),
        ips: [...new Set(matches.map(m => m.ip).filter(ip => ip !== "unknown"))],
        recommendation: getRecommendation(rule.id),
      });
    }
  }

  // Check IPs against reputation list
  const allIPs = [...logText.matchAll(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g)].map(m => m[0]);
  const uniqueIPs = [...new Set(allIPs)];
  const flaggedIPs = uniqueIPs
    .map(ip => ({ ip, ...assessIPReputation(ip) }))
    .filter(r => r.flagged);

  return { findings, flagged_ips: flaggedIPs, total_ips: uniqueIPs.length };
}

function getRecommendation(id) {
  const recs = {
    BRUTE_FORCE: "Block source IP at firewall. Enable account lockout after 5 failures. Consider Fail2ban or CrowdSec.",
    SQL_INJECTION: "Immediately check WAF logs. Review query parameterisation. Check for data exfiltration.",
    DIR_TRAVERSAL: "Block source IP. Verify web server chroot/container boundaries. Check file integrity.",
    ADMIN_CREATION: "Verify with Change Management. If unauthorised, treat as active compromise — isolate host.",
    IMPOSSIBLE_TRAVEL: "Flag account for review. Force password reset. Check for session token theft.",
    BEACONING: "Capture PCAP of outbound traffic. Block destination IP at firewall. Run host forensics.",
    KNOWN_MALICIOUS_IP: "Isolate affected host immediately. Run full AV scan. Report to CIRT.",
    OFF_HOURS_ACCESS: "Correlate with staff duty roster. Enable additional logging on affected account.",
    PORT_SCAN: "Block scanner IP at perimeter. Verify no services exposed on unexpected ports.",
    DATA_EXFIL: "Block outbound to destination. Isolate host. Preserve memory for forensics.",
  };
  return recs[id] || "Investigate further. Correlate with other log sources.";
}

function main() {
  let logText = process.argv.slice(2).join(" ") || "";

  // If piped input
  if (!logText && !process.stdin.isTTY) {
    let input = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", chunk => { input += chunk; });
    process.stdin.on("end", () => {
      console.log(JSON.stringify(detectAnomalies(input), null, 2));
    });
    return;
  }

  if (!logText) {
    console.log("Usage: node log_analyser.js '<log-text>'");
    console.log("   or: cat auth.log | node log_analyser.js");
    process.exit(1);
  }

  console.log(JSON.stringify(detectAnomalies(logText), null, 2));
}

main();
