/**
 * scan-and-store.js  (v2)
 *
 * Runs Semgrep, Gitleaks, Trivy on a repo and tracks every finding over time:
 *   - scannedCommitSha      : commit the scan ran against (HEAD)
 *   - git_commit_hash  : commit that most likely introduced the finding
 *   - status                : open | resolved | reopened  (set automatically)
 *   - fixingCommitSha       : commit that most likely fixed it
 *   - manualStatus          : YOUR field (false_positive, accepted_risk...) - never touched by this script
 *
 * Collections:
 *   findings                 ALL tools together (normalized, no raw) - input for correlation
 *   semgrepfindings / gitleaksfindings / trivyfindings / sonarqubefindings
 *                            per-tool copy with raw scanner output
 *                          one doc per finding for its whole life (never deleted)
 *   scanruns               one doc per run (history)
 *   securityscanreports    one summary doc per project (dashboard)
 *
 * Usage:
 *   node scan-and-store.js <repoPath> <accountId> <repo_id> <projectKey> [branch]
 *
 * Requirements: Node 18+, npm install mongodb ; semgrep, gitleaks, trivy, git on PATH
 * SonarQube (optional): set SONAR_URL and SONAR_TOKEN. Optional: SONAR_PROJECT_KEY (defaults to
 *   projectKey), SONAR_TYPES, SONAR_BRANCH.
 */

const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGO_DB_NAME || "evidence-rca";
// SonarQube is read through its web API (optional - enabled when both are set).
const SONAR_URL = (process.env.SONAR_URL || "").replace(/\/$/, "");
const SONAR_TOKEN = process.env.SONAR_TOKEN || "";
const SONAR_ENABLED = !!(SONAR_URL && SONAR_TOKEN);
const sonarSuppressed = new Set(); // Sonar keys marked FALSE-POSITIVE / WONTFIX on the server
const RUNS = "scanruns";
const SUMMARY = "securityscanreports";

// ---------------------------------------------------------------------
// 0. Args
// ---------------------------------------------------------------------
const [repoPath, accountIdArg, repoIdArg, projectKey, branchArg] = process.argv.slice(2);
const branch = branchArg || "main";

if (!repoPath || !accountIdArg || !repoIdArg || !projectKey) {
  console.error("Usage: node scan-and-store.js <repoPath> <accountId> <repo_id> <projectKey> [branch]");
  process.exit(1);
}
if (!fs.existsSync(repoPath) || !fs.statSync(repoPath).isDirectory()) {
  console.error(`repoPath is not a directory: ${repoPath}`);
  process.exit(1);
}
if (!ObjectId.isValid(accountIdArg)) {
  console.error(`accountId is not a valid ObjectId: ${accountIdArg}`);
  process.exit(1);
}
const accountId = new ObjectId(accountIdArg);
const repo_id = Number(repoIdArg);
if (!Number.isFinite(repo_id)) {
  console.error(`repo_id must be numeric: ${repoIdArg}`);
  process.exit(1);
}

const SONAR_PROJECT_KEY = process.env.SONAR_PROJECT_KEY || projectKey;
const repoName = path.basename(path.resolve(repoPath));
const outputDir = path.join(__dirname, "scan-output", projectKey);
fs.mkdirSync(outputDir, { recursive: true });

const scanId = `${projectKey}_${Date.now()}`;
const scannedAt = new Date();

// ---------------------------------------------------------------------
// 1. Git helpers
// ---------------------------------------------------------------------
const git = (...args) =>
  execFileSync("git", args, { cwd: repoPath, encoding: "utf-8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }).trim();
const tryGit = (...args) => {
  try { return git(...args); } catch { return ""; }
};

let commitSha;
try {
  commitSha = git("rev-parse", "HEAD");
} catch {
  console.error("repoPath is not a git repository (or has no commits).");
  process.exit(1);
}
const dirty = tryGit("status", "--porcelain") !== "";
const currentBranch = tryGit("rev-parse", "--abbrev-ref", "HEAD");
if (dirty) console.warn("WARNING: working tree is dirty - commit SHA does not fully describe what was scanned.");
if (currentBranch && currentBranch !== "HEAD" && currentBranch !== branch) {
  console.warn(`WARNING: checked-out branch is '${currentBranch}' but you passed '${branch}'.`);
}

const infoCache = new Map();
function commitInfo(sha) {
  if (!sha) return {};
  if (!infoCache.has(sha)) {
    const [author, date, message] = tryGit("show", "-s", "--format=%an%x1f%aI%x1f%s", sha).split("\x1f");
    infoCache.set(sha, { sha, author, date, message });
  }
  return infoCache.get(sha);
}

// Blame a line range; returns the most recent commit + all commits seen.
function blame(file, start, end) {
  if (!file || !start) return null;
  const out = tryGit("blame", "-w", "-M", "-C", "--porcelain", "-L", `${start},${end || start}`, "--", file);
  if (!out) return null;
  const commits = {};
  let cur;
  for (const line of out.split("\n")) {
    const m = line.match(/^([0-9a-f]{40}) /);
    if (m) { cur = m[1]; commits[cur] = commits[cur] || { time: 0 }; }
    else if (line.startsWith("committer-time ")) commits[cur].time = Number(line.slice(15));
  }
  const shas = Object.keys(commits)
    .filter((s) => !/^0+$/.test(s)) // ignore uncommitted lines
    .sort((a, b) => commits[b].time - commits[a].time);
  if (!shas.length) return null;
  return { sha: shas[0], all: shas, confidence: shas.length === 1 ? "high" : "medium" };
}

function readLines(file, start, end) {
  try {
    const lines = fs.readFileSync(path.join(repoPath, file), "utf-8").split("\n");
    return lines.slice(Math.max(0, start - 1), end || start);
  } catch {
    return null;
  }
}

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ---------------------------------------------------------------------
// 2. Run scanners (stale output deleted first; success tracked per tool)
// ---------------------------------------------------------------------
const outFile = (n) => path.join(outputDir, `${n}-results.json`);

function runTool(name, command) {
  try { fs.unlinkSync(outFile(name)); } catch {}
  console.log(`\n[${name}] ${command}`);
  try {
    execSync(command, { cwd: repoPath, stdio: "inherit" });
  } catch {
    console.warn(`[${name}] exited non-zero (usually means findings were found).`);
  }
  try {
    return JSON.parse(fs.readFileSync(outFile(name), "utf-8"));
  } catch (e) {
    console.warn(`[${name}] no usable output -> marked FAILED (its findings will NOT be resolved).`);
    return null;
  }
}

const version = (cmd) => {
  try { return execSync(cmd, { cwd: repoPath, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).split("\n")[0].trim(); }
  catch { return null; }
};

const semgrepData = runTool("semgrep", `semgrep --config auto --config "p/security-audit" --json --output "${outFile("semgrep")}" .`);
// No --no-git: Gitleaks scans history and reports commit/author/date.
const gitleaksData = runTool("gitleaks", `gitleaks detect --source . --report-format json --report-path "${outFile("gitleaks")}" -v`);
const trivyData = runTool("trivy", `trivy fs --format json --output "${outFile("trivy")}" .`);

const toolOk = {
  semgrep: !!(semgrepData && Array.isArray(semgrepData.results)),
  gitleaks: Array.isArray(gitleaksData),
  trivy: !!(trivyData && Array.isArray(trivyData.Results ?? [])) && trivyData !== null,
  sonarqube: SONAR_ENABLED ? false : null, // set to true by loadSonar()
};
const okTools = new Set(Object.keys(toolOk).filter((t) => toolOk[t]));

// ---------------------------------------------------------------------
// 3. Normalize + stable fingerprints (no line numbers -> survives code shifts)
// ---------------------------------------------------------------------
function normalizeSemgrep(data) {
  if (!data?.results) return [];
  return data.results.map((r) => {
    const code = (readLines(r.path, r.start?.line, r.end?.line) || []).join("\n").replace(/\s+/g, " ").trim();
    return {
      tool: "semgrep", category: "sast", ruleId: r.check_id,
      severity: r.extra?.severity || "UNKNOWN", message: r.extra?.message || "",
      file: r.path, startLine: r.start?.line, endLine: r.end?.line,
      base: ["semgrep", r.check_id, r.path, sha256(code)].join("|"), raw: r,
    };
  });
}

function normalizeGitleaks(data) {
  if (!Array.isArray(data)) return [];
  return data.map((r) => ({
    tool: "gitleaks", category: "secret", ruleId: r.RuleID, severity: "HIGH",
    message: r.Description, file: r.File, startLine: r.StartLine, endLine: r.EndLine,
    commit: r.Commit, author: r.Author, commitDate: r.Date, commitMessage: r.Message,
    base: r.Fingerprint || ["gitleaks", r.RuleID, r.File, r.Commit, sha256(r.Secret || "")].join("|"),
    raw: { ...r, Secret: undefined, Match: undefined }, // don't store the actual secret
  }));
}

function normalizeTrivy(data) {
  if (!data?.Results) return [];
  const out = [];
  for (const res of data.Results) {
    for (const v of res.Vulnerabilities || []) {
      out.push({
        tool: "trivy", category: "sca", ruleId: v.VulnerabilityID, severity: v.Severity,
        message: v.Title || v.Description, file: res.Target,
        pkgName: v.PkgName, installedVersion: v.InstalledVersion, fixedVersion: v.FixedVersion,
        base: ["trivy", v.VulnerabilityID, res.Target, v.PkgName].join("|"), raw: v,
      });
    }
  }
  return out;
}

const allFindings = [
  ...(toolOk.semgrep ? normalizeSemgrep(semgrepData) : []),
  ...(toolOk.gitleaks ? normalizeGitleaks(gitleaksData) : []),
  ...(toolOk.trivy ? normalizeTrivy(trivyData) : []),
];

// Same rule + same code twice in one file -> add #n so fingerprints stay unique.
const seen = new Map();
for (const f of allFindings) {
  const n = (seen.get(f.base) || 0) + 1;
  seen.set(f.base, n);
  f.fingerprint = sha256(`${f.base}#${n}`);
  delete f.base;
}
console.log(`\nParsed ${allFindings.length} findings (scanId=${scanId}, commit=${commitSha.slice(0, 8)})`);

// ---------------------------------------------------------------------
// 4. Introducing commit (only computed once, when a finding is first seen)
// ---------------------------------------------------------------------
function introducing(f) {
  let b = null;
  if (f.tool === "gitleaks") {
    b = f.commit ? { sha: f.commit, all: [f.commit], confidence: "high" } : null;
  } else if (f.tool === "semgrep" || f.tool === "sonarqube") {
    b = blame(f.file, f.startLine, f.endLine);
  } else if (f.tool === "trivy") {
    const lines = readLines(f.file, 1, 1e9) || [];
    const i = lines.findIndex((l) => l.includes(f.pkgName));
    b = i >= 0 ? blame(f.file, i + 1, i + 1) : null;
    if (!b) {
      const sha = tryGit("log", "-1", "--format=%H", "--", f.file);
      if (sha) b = { sha, all: [sha], confidence: "low" };
    }
  }
  if (!b) return { git_commit_hash: null, blameConfidence: "none" };
  const info = commitInfo(b.sha);
  return {
    git_commit_hash: b.sha,
    introducingCommitsAll: b.all,
    git_author: info.author,
    git_commit_date: info.date,
    git_commit_summary: info.message,
    blameConfidence: b.confidence,
  };
}

// ---------------------------------------------------------------------
// 5. Why did a finding disappear?
// ---------------------------------------------------------------------
function explainResolved(old) {
  const exists = fs.existsSync(path.join(repoPath, old.file));
  let fixingSha = null;
  if (old.lastSeenCommitSha && old.lastSeenCommitSha !== commitSha) {
    fixingSha = tryGit("log", "-1", "--format=%H", `${old.lastSeenCommitSha}..HEAD`, "--", old.file) || null;
  }

  let suppressed = false;
  if (old.tool === "sonarqube" && sonarSuppressed.has(old.sonarKey)) suppressed = true;
  const re = /nosemgrep|gitleaks:allow|trivy:ignore|NOSONAR/;
  if (old.startLine) {
    const near = readLines(old.file, Math.max(1, old.startLine - 1), (old.endLine || old.startLine) + 1);
    if (near && near.some((l) => re.test(l))) suppressed = true;
  }
  try {
    if (fs.readFileSync(path.join(repoPath, ".gitleaksignore"), "utf-8").includes(old.fingerprint)) suppressed = true;
  } catch {}

  let reason = "unknown";
  if (!exists) reason = "file_deleted";
  else if (suppressed) reason = "suppressed";
  else if (old.tool === "trivy") reason = "dependency_upgraded";
  else if (fixingSha) reason = "code_changed";
  return { reason, fixingSha };
}

// ---------------------------------------------------------------------
// SonarQube loader (API) - same lifecycle as the other tools
// ---------------------------------------------------------------------
async function sonarGet(params) {
  const auth = "Basic " + Buffer.from(SONAR_TOKEN + ":").toString("base64");
  const issues = [];
  for (let page = 1; page <= 20; page++) { // SonarQube API hard limit: 10,000 results
    const qs = new URLSearchParams({ componentKeys: SONAR_PROJECT_KEY, ps: "500", p: String(page), ...params });
    const res = await fetch(`${SONAR_URL}/api/issues/search?${qs}`, { headers: { Authorization: auth } });
    if (!res.ok) throw new Error(`SonarQube API ${res.status} ${res.statusText}`);
    const data = await res.json();
    issues.push(...data.issues);
    if (page * 500 >= data.paging.total) return issues;
  }
  console.warn("SonarQube: more than 10,000 issues - results truncated. Narrow with SONAR_TYPES.");
  return issues;
}

async function loadSonar() {
  if (!SONAR_ENABLED) {
    console.log("\n[sonarqube] skipped (set SONAR_URL and SONAR_TOKEN to enable).");
    return;
  }
  try {
    const extra = {};
    if (process.env.SONAR_TYPES) extra.types = process.env.SONAR_TYPES; // e.g. VULNERABILITY,SECURITY_HOTSPOT
    if (process.env.SONAR_BRANCH) extra.branch = process.env.SONAR_BRANCH;
    const open = await sonarGet({ resolved: "false", ...extra });
    const dismissed = await sonarGet({ resolved: "true", resolutions: "FALSE-POSITIVE,WONTFIX", ...extra });
    dismissed.forEach((i) => sonarSuppressed.add(i.key));

    for (const i of open) {
      allFindings.push({
        tool: "sonarqube", category: "sast", ruleId: i.rule, severity: i.severity,
        message: i.message, sonarType: i.type, sonarKey: i.key,
        file: i.component.replace(`${SONAR_PROJECT_KEY}:`, ""),
        startLine: i.textRange?.startLine ?? i.line,
        endLine: i.textRange?.endLine ?? i.line,
        fingerprint: sha256(`sonarqube|${i.key}`), // Sonar's issue key is already stable
        raw: i,
      });
    }
    toolOk.sonarqube = true;
    okTools.add("sonarqube");
    console.log(`\n[sonarqube] fetched ${open.length} open issues.`);
  } catch (e) {
    console.warn(`[sonarqube] FAILED: ${e.message} -> its findings will NOT be resolved.`);
  }
}

// ---------------------------------------------------------------------
// 6. Sync with MongoDB - one collection PER TOOL
// ---------------------------------------------------------------------
const COLLECTIONS = {
  semgrep: process.env.MONGO_SEMGREP_COLLECTION || "semgrepfindings",
  gitleaks: process.env.MONGO_GITLEAKS_COLLECTION || "gitleaksfindings",
  trivy: process.env.MONGO_TRIVY_COLLECTION || "trivyfindings",
  sonarqube: process.env.MONGO_SONAR_COLLECTION || "sonarqubefindings",
};

async function syncTool(db, tool) {
  const col = db.collection(COLLECTIONS[tool]);
  await col.createIndex({ projectKey: 1, branch: 1, fingerprint: 1 }, { unique: true });
  await col.createIndex({ projectKey: 1, status: 1 });
  await col.createIndex({ git_commit_hash: 1 });

  const counts = { new: 0, reopened: 0, resolved: 0, unchanged: 0 };
  const openFilter = { projectKey, branch, status: { $in: ["open", "reopened"] } };

  // Tool failed -> touch nothing (never resolve findings on a failed scan).
  if (!toolOk[tool]) return { counts, open: await col.countDocuments(openFilter) };

  const findings = allFindings.filter((f) => f.tool === tool);
  const existing = await col.find({ projectKey, branch }).toArray();
  const byFp = new Map(existing.map((d) => [d.fingerprint, d]));
  const currentFps = new Set(findings.map((f) => f.fingerprint));
  const ops = [];

  for (const f of findings) {
    const old = byFp.get(f.fingerprint);
    const common = {
      ...f,
      accountId, repo_id, repo: repoName, projectKey, branch,
      lastSeenScanId: scanId, lastSeenCommitSha: commitSha, lastSeenAt: scannedAt, updatedAt: new Date(),
    };

    if (!old) {
      counts.new++;
      ops.push({
        insertOne: {
          document: {
            ...common, ...introducing(f),
            status: "open", reopenCount: 0,
            firstSeenScanId: scanId, firstSeenCommitSha: commitSha, firstSeenAt: scannedAt,
            createdAt: new Date(),
          },
        },
      });
    } else if (old.status === "resolved") {
      counts.reopened++;
      ops.push({
        updateOne: {
          filter: { _id: old._id },
          update: {
            $set: {
              ...common, status: "reopened",
              resolvedScanId: null, resolvedAt: null, resolvedAtCommitSha: null,
              fixingCommitSha: null, resolvedReason: null,
            },
            $inc: { reopenCount: 1 },
          },
        },
      });
    } else {
      counts.unchanged++;
      ops.push({ updateOne: { filter: { _id: old._id }, update: { $set: common } } });
    }
  }

  for (const old of existing) {
    if (old.status === "resolved" || currentFps.has(old.fingerprint)) continue;
    const { reason, fixingSha } = explainResolved(old);
    counts.resolved++;
    ops.push({
      updateOne: {
        filter: { _id: old._id },
        update: {
          $set: {
            status: "resolved", resolvedScanId: scanId, resolvedAt: scannedAt,
            resolvedAtCommitSha: commitSha, fixingCommitSha: fixingSha, resolvedReason: reason,
            updatedAt: new Date(),
          },
        },
      },
    });
  }

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  return { counts, open: await col.countDocuments(openFilter) };
}

// Unified collection: every tool's findings side by side, ready for the correlation layer.
// This script only STORES - it never correlates. Raw scanner output stays in the per-tool
// collections (see sourceCollection / sourceId); the unified docs hold the normalized fields.
const UNIFIED = process.env.MONGO_FINDINGS_COLLECTION || "findings";

async function mirrorToFindings(db, tool) {
  const unified = db.collection(UNIFIED);
  await unified.createIndex({ projectKey: 1, branch: 1, tool: 1, fingerprint: 1 }, { unique: true });
  await unified.createIndex({ projectKey: 1, status: 1 });
  await unified.createIndex({ git_commit_hash: 1 });

  const docs = await db.collection(COLLECTIONS[tool]).find({ projectKey, branch }, { projection: { raw: 0 } }).toArray();
  // $set (not replace) so fields the correlation layer adds later (e.g. clusterId) survive rescans.
  const ops = docs.map(({ _id, ...rest }) => ({
    updateOne: {
      filter: { projectKey, branch, tool, fingerprint: rest.fingerprint },
      update: {
        $set: { ...rest, sourceCollection: COLLECTIONS[tool], sourceId: _id },
        $setOnInsert: { embeddingStatus: "pending" }, // mongoose defaults don't apply to raw driver writes
      },
      upsert: true,
    },
  }));
  if (ops.length) await unified.bulkWrite(ops, { ordered: false });
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection(RUNS).createIndex({ projectKey: 1, scannedAt: -1 });
    await db.collection(SUMMARY).createIndex({ projectKey: 1 }, { unique: true });

    await loadSonar();

    const byTool = {};
    const openByTool = {};
    const total = { new: 0, reopened: 0, resolved: 0, unchanged: 0 };
    for (const tool of Object.keys(COLLECTIONS)) {
      const r = await syncTool(db, tool);
      if (toolOk[tool]) await mirrorToFindings(db, tool);
      byTool[tool] = r.counts;
      openByTool[tool] = r.open;
      for (const k of Object.keys(total)) total[k] += r.counts[k];
    }
    const openTotal = Object.values(openByTool).reduce((a, b) => a + b, 0);

    await db.collection(RUNS).insertOne({
      scanId, projectKey, branch, accountId, repo_id,
      commitSha, dirty, scannedAt,
      toolStatus: toolOk,
      toolVersions: { semgrep: version("semgrep --version"), gitleaks: version("gitleaks version"), trivy: version("trivy --version") },
      counts: total, countsByTool: byTool, openTotal, openByTool,
    });

    await db.collection(SUMMARY).updateOne(
      { projectKey },
      {
        $set: {
          projectKey, accountId, repo_id, branch, repo: repoName, repoPath: path.resolve(repoPath),
          scanId, scannedCommitSha: commitSha, dirty,
          openTotal, openByTool, lastRunCounts: total, lastRunCountsByTool: byTool, toolStatus: toolOk,
          status: okTools.size === Object.values(toolOk).filter((v) => v !== null).length ? "SUCCESS" : "PARTIAL",
          scannedAt, updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    console.log("\n--- Result ---");
    for (const t of Object.keys(byTool)) {
      const c = byTool[t];
      console.log(`${t}: new ${c.new}, reopened ${c.reopened}, resolved ${c.resolved}, unchanged ${c.unchanged}, open now ${openByTool[t]}`);
    }
  } finally {
    await client.close();
  }
}

main()
  .then(() => console.log("Done."))
  .catch((err) => {
    console.error("MongoDB save failed:", err);
    process.exit(1);
  });