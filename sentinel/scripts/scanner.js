#!/usr/bin/env node
/**
 * SENTINEL Threat Scanner — file, URL, and hash analysis
 * Usage: node scanner.js <file|url|hash> <target>
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const VT_KEY = process.env.VT_API_KEY || "8b76ff371f507f7bc0a591da87356104ff054a1ac2e2f1aab90055a0e4550612";

// --- YARA rules directory ---
const YARA_DIR = path.join(__dirname, "yara_rules");
if (!fs.existsSync(YARA_DIR)) fs.mkdirSync(YARA_DIR, { recursive: true });

const [mode, target] = process.argv.slice(2);

// ===== FILE SCAN =====
async function scanFile(filePath) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    return { error: "File not found", path: absPath };
  }

  const results = {
    file: absPath,
    size_bytes: fs.statSync(absPath).size,
  };

  // 1. File type
  results.file_type = execSync(`file "${absPath}"`).toString().trim();

  // 2. Suspicious strings analysis
  const stringsOut = execSync(`strings "${absPath}" 2>/dev/null | sort -u`).toString().split("\n");
  const suspicious = [];
  const suspectPatterns = [
    /eval\s*\(/, /exec\s*\(/, /base64_decode/, /fromCharCode/, /cmd\.exe/i,
    /powershell/i, /wget\s+/i, /curl\s+.*-O/i, /chmod\s+\+x/i,
    /\/etc\/passwd/, /\.onion/, /cryptominer/i, /ReverseShell/i,
    /CreateProcess/i, /WinExec/i, /ShellExecute/i,
  ];
  for (const line of stringsOut) {
    for (const pat of suspectPatterns) {
      if (pat.test(line)) {
        suspicious.push(line.substring(0, 120));
        break;
      }
    }
  }
  results.suspicious_strings = [...new Set(suspicious)].slice(0, 30);

  // 3. ClamAV scan
  try {
    const clam = execSync(`clamscan --no-summary "${absPath}" 2>&1`).toString().trim();
    results.clamav = clam.includes("OK") ? "Clean" : clam;
  } catch (e) {
    results.clamav = "Error: " + (e.stdout?.toString()?.trim() || e.message);
  }

  // 4. YARA scan
  const yaraFiles = fs.readdirSync(YARA_DIR).filter(f => f.endsWith(".yar") || f.endsWith(".yara"));
  if (yaraFiles.length > 0) {
    const yaraResults = [];
    for (const ruleFile of yaraFiles) {
      try {
        const out = execSync(`yara "${YARA_DIR}/${ruleFile}" "${absPath}" 2>&1`).toString().trim();
        if (out) yaraResults.push(`${ruleFile}: ${out}`);
      } catch (_) {}
    }
    results.yara = yaraResults.length > 0 ? yaraResults : "No matches";
  } else {
    results.yara = "No YARA rules loaded";
  }

  // 5. SHA256 hash
  results.sha256 = execSync(`sha256sum "${absPath}"`).toString().split(" ")[0];

  // 6. Entropy
  const buf = fs.readFileSync(absPath);
  let counts = new Array(256).fill(0);
  for (const byte of buf) counts[byte]++;
  let entropy = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / buf.length;
      entropy -= p * Math.log2(p);
    }
  }
  results.entropy = entropy.toFixed(2);
  results.entropy_note = entropy > 7.0 ? "HIGH — possible encrypted/packed content" : "Normal range";

  return results;
}

// ===== URL SCAN =====
async function scanUrl(url) {
  // Submit URL
  const submitRes = await fetch("https://www.virustotal.com/api/v3/urls", {
    method: "POST",
    headers: { "x-apikey": VT_KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ url }),
  });
  const submitData = await submitRes.json();
  if (submitData.error) return { error: submitData.error.message };

  const analysisId = submitData.data?.id;
  if (!analysisId) return { error: "No analysis ID returned" };

  await new Promise(r => setTimeout(r, 5000));
  const resultRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
    headers: { "x-apikey": VT_KEY },
  });
  const resultData = await resultRes.json();
  const stats = resultData.data?.attributes?.stats || {};
  return {
    url,
    malicious: stats.malicious || 0,
    suspicious: stats.suspicious || 0,
    harmless: stats.harmless || 0,
    undetected: stats.undetected || 0,
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    permalink: `https://www.virustotal.com/gui/url/${analysisId}`,
  };
}

// ===== HASH LOOKUP =====
async function lookupHash(hash) {
  const res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
    headers: { "x-apikey": VT_KEY },
  });
  const data = await res.json();
  if (data.error) return { error: data.error.message };

  const attrs = data.data?.attributes || {};
  const stats = attrs.last_analysis_stats || {};
  return {
    hash,
    type: attrs.type_description || "Unknown",
    first_seen: attrs.first_submission_date
      ? new Date(attrs.first_submission_date * 1000).toISOString() : "N/A",
    last_seen: attrs.last_submission_date
      ? new Date(attrs.last_submission_date * 1000).toISOString() : "N/A",
    malicious: stats.malicious || 0,
    suspicious: stats.suspicious || 0,
    harmless: stats.harmless || 0,
    undetected: stats.undetected || 0,
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    names: (attrs.names || []).slice(0, 10),
    tags: (attrs.tags || []).slice(0, 10),
    permalink: `https://www.virustotal.com/gui/file/${hash}`,
  };
}

// ===== MAIN =====
async function main() {
  if (!mode || !target) {
    console.log("Usage: node scanner.js <file|url|hash> <target>");
    process.exit(1);
  }

  let result;
  switch (mode) {
    case "file": result = await scanFile(target); break;
    case "url":  result = await scanUrl(target);  break;
    case "hash": result = await lookupHash(target); break;
    default:
      console.log(`Unknown mode: ${mode}. Use: file|url|hash`);
      process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => console.error("Error:", err.message));
