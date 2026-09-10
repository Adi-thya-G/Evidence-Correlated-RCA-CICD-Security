/**
 * scan-and-store.js
 *
 * Runs Semgrep, Gitleaks, and Trivy against a given repo path, parses each
 * tool's JSON output, and stores results TWO ways:
 *
 *   1. One summary document per project (upserted by projectKey), same
 *      pattern as SonarQubeReport — good for a dashboard overview. Now
 *      also includes a diff against the PREVIOUS scan (resolved / new /
 *      unchanged counts) so you can confirm a fix actually worked.
 *   2. Three separate collections, one per tool (semgrepfindings,
 *      trivyfindings, gitleaksfindings) — good for filtering, paginating,
 *      and managing findings per tool. Each run replaces that project's
 *      rows with the latest results.
 *
 * Every document is stamped with a scanId + scannedAt so you can always
 * confirm which run the data in the DB belongs to.
 *
 * Usage:
 *   node scan-and-store.js <repoPath> <accountId> <repo_id> <projectKey> [branch]
 *
 * Example:
 *   node scan-and-store.js /path/to/client-repo 6a967f175f33407337092711 1341658140 158157512_1341658140 main
 *
 * Requirements:
 *   npm install mongodb
 *   semgrep, gitleaks, trivy must be installed and on PATH
 *   MongoDB running locally (or set MONGO_URI env var)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
// Point this at the SAME database your SonarQubeReport model uses.
const DB_NAME = process.env.MONGO_DB_NAME || "evidence-rca";

const SUMMARY_COLLECTION = process.env.MONGO_SUMMARY_COLLECTION || "securityscanreports";
const SEMGREP_COLLECTION = process.env.MONGO_SEMGREP_COLLECTION || "semgrepfindings";
const TRIVY_COLLECTION = process.env.MONGO_TRIVY_COLLECTION || "trivyfindings";
const GITLEAKS_COLLECTION = process.env.MONGO_GITLEAKS_COLLECTION || "gitleaksfindings";

// ---------------------------------------------------------------------
// 0. Parse + validate arguments
// ---------------------------------------------------------------------
const [repoPath, accountIdArg, repoIdArg, projectKey, branchArg] = process.argv.slice(2);
const branch = branchArg || "main";

if (!repoPath || !accountIdArg || !repoIdArg || !projectKey) {
  console.error(
    "Usage: node scan-and-store.js <repoPath> <accountId> <repo_id> <projectKey> [branch]",
  );
  console.error("  repoPath   - path to the repo to scan");
  console.error("  accountId  - Mongo ObjectId of the user/account (matches SonarQubeReport.accountId)");
  console.error("  repo_id    - GitHub repository id (matches SonarQubeReport.repo_id)");
  console.error("  projectKey - matches SonarQubeReport.projectKey, e.g. '158157512_1341658140'");
  console.error("  branch     - optional, defaults to 'main'");
  process.exit(1);
}

if (!fs.existsSync(repoPath) || !fs.statSync(repoPath).isDirectory()) {
  console.error(`repoPath does not exist or is not a directory: ${repoPath}`);
  process.exit(1);
}

if (!ObjectId.isValid(accountIdArg)) {
  console.error(`accountId is not a valid Mongo ObjectId: ${accountIdArg}`);
  process.exit(1);
}
const accountId = new ObjectId(accountIdArg);

const repo_id = Number(repoIdArg);
if (!Number.isFinite(repo_id)) {
  console.error(`repo_id must be numeric: ${repoIdArg}`);
  process.exit(1);
}

const repoName = path.basename(path.resolve(repoPath));
const outputDir = path.join(__dirname, "scan-output", projectKey);
fs.mkdirSync(outputDir, { recursive: true });

const semgrepOut = path.join(outputDir, "semgrep-results.json");
const gitleaksOut = path.join(outputDir, "gitleaks-results.json");
const trivyOut = path.join(outputDir, "trivy-results.json");

// Unique id for THIS run — every doc written this run carries it, so you
// can always confirm "yes, this row is from my latest scan."
const scanId = `${projectKey}_${Date.now()}`;
const scannedAt = new Date();

function runTool(name, command) {
  console.log(`\n[${name}] Running: ${command}`);
  try {
    execSync(command, { cwd: repoPath, stdio: "inherit" });
  } catch (err) {
    // Semgrep/Gitleaks/Trivy exit non-zero when findings exist — that's expected,
    // not a real failure. Only warn if the output file wasn't actually created.
    console.warn(`[${name}] exited non-zero (likely because findings were found) — continuing.`);
  }
}

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Could not read/parse ${filePath}:`, err.message);
    return null;
  }
}

// ---------------------------------------------------------------------
// 1. Run each scanner
// ---------------------------------------------------------------------
runTool("Semgrep", `semgrep --config auto --config "p/security-audit" --json --output "${semgrepOut}" .`);
runTool("Gitleaks", `gitleaks detect --source . --report-format json --report-path "${gitleaksOut}" --no-git -v`);
runTool("Trivy", `trivy fs --format json --output "${trivyOut}" .`);

// ---------------------------------------------------------------------
// 2. Parse + normalize each tool's output into a common shape
// ---------------------------------------------------------------------
function normalizeSemgrep(data) {
  if (!data || !data.results) return [];
  return data.results.map((r) => ({
    tool: "semgrep",
    category: "sast",
    ruleId: r.check_id,
    severity: r.extra?.severity || "UNKNOWN",
    message: r.extra?.message || "",
    file: r.path,
    startLine: r.start?.line,
    endLine: r.end?.line,
    raw: r,
  }));
}

function normalizeGitleaks(data) {
  if (!Array.isArray(data)) return [];
  return data.map((r) => ({
    tool: "gitleaks",
    category: "secret",
    ruleId: r.RuleID,
    severity: "HIGH", // secrets are treated as high severity by default
    message: r.Description,
    file: r.File,
    startLine: r.StartLine,
    endLine: r.EndLine,
    commit: r.Commit,
    author: r.Author,
    raw: r,
  }));
}

function normalizeTrivy(data) {
  if (!data || !data.Results) return [];
  const findings = [];
  for (const result of data.Results) {
    for (const vuln of result.Vulnerabilities || []) {
      findings.push({
        tool: "trivy",
        category: "sca",
        ruleId: vuln.VulnerabilityID,
        severity: vuln.Severity,
        message: vuln.Title || vuln.Description,
        file: result.Target,
        pkgName: vuln.PkgName,
        installedVersion: vuln.InstalledVersion,
        fixedVersion: vuln.FixedVersion,
        raw: vuln,
      });
    }
  }
  return findings;
}

const semgrepFindings = normalizeSemgrep(readJsonSafe(semgrepOut));
const gitleaksFindings = normalizeGitleaks(readJsonSafe(gitleaksOut));
const trivyFindings = normalizeTrivy(readJsonSafe(trivyOut));
const allFindings = [...semgrepFindings, ...gitleaksFindings, ...trivyFindings];

console.log(
  `\nParsed findings — Semgrep: ${semgrepFindings.length}, Gitleaks: ${gitleaksFindings.length}, Trivy: ${trivyFindings.length}`,
);
console.log(`Total: ${allFindings.length} findings (scanId=${scanId})`);

function withLinkFields(f) {
  return {
    ...f,
    accountId,
    repo_id,
    projectKey,
    branch,
    repo: repoName,
    scanId,
    scannedAt,
  };
}

const semgrepDocs = semgrepFindings.map(withLinkFields);
const gitleaksDocs = gitleaksFindings.map(withLinkFields);
const trivyDocs = trivyFindings.map(withLinkFields);

// ---------------------------------------------------------------------
// 3. Diff helper — a stable key per finding so we can tell what's new,
//    what's resolved (was there before, gone now — i.e. your fix worked),
//    and what's unchanged, when comparing against the previous scan.
// ---------------------------------------------------------------------
function findingKey(f) {
  return `${f.tool}::${f.ruleId}::${f.file}::${f.startLine ?? ""}`;
}

function diffFindings(previousDocs, currentDocs) {
  const prevKeys = new Set(previousDocs.map(findingKey));
  const currKeys = new Set(currentDocs.map(findingKey));

  let resolvedCount = 0; // was present before, gone now
  for (const k of prevKeys) {
    if (!currKeys.has(k)) resolvedCount++;
  }

  let newCount = 0; // wasn't present before, present now
  for (const k of currKeys) {
    if (!prevKeys.has(k)) newCount++;
  }

  const unchangedCount = currKeys.size - newCount;

  return { previousTotal: previousDocs.length, currentTotal: currentDocs.length, resolvedCount, newCount, unchangedCount };
}

// ---------------------------------------------------------------------
// 4. Save: per-tool collections (with diff against previous scan) +
//    summary doc (SonarQube-style)
// ---------------------------------------------------------------------
async function replaceToolFindings(db, collectionName, newDocs) {
  const collection = db.collection(collectionName);
  await collection.createIndex({ projectKey: 1 });
  await collection.createIndex({ accountId: 1 });
  await collection.createIndex({ repo_id: 1 });
  await collection.createIndex({ severity: 1 });
  await collection.createIndex({ scanId: 1 });

  // Grab the previous scan's docs for this project BEFORE wiping them,
  // so we can diff old vs new.
  const previousDocs = await collection.find({ projectKey }).toArray();
  const diff = diffFindings(previousDocs, newDocs);

  await collection.deleteMany({ projectKey });
  if (newDocs.length > 0) {
    await collection.insertMany(newDocs);
  }

  return diff;
}

async function saveToMongo() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    const [semgrepDiff, gitleaksDiff, trivyDiff] = await Promise.all([
      replaceToolFindings(db, SEMGREP_COLLECTION, semgrepDocs),
      replaceToolFindings(db, GITLEAKS_COLLECTION, gitleaksDocs),
      replaceToolFindings(db, TRIVY_COLLECTION, trivyDocs),
    ]);

    console.log("\n--- Diff vs previous scan ---");
    for (const [name, diff] of [
      ["semgrep", semgrepDiff],
      ["gitleaks", gitleaksDiff],
      ["trivy", trivyDiff],
    ]) {
      console.log(
        `${name}: ${diff.previousTotal} -> ${diff.currentTotal}  (resolved: ${diff.resolvedCount}, new: ${diff.newCount}, unchanged: ${diff.unchangedCount})`,
      );
    }

    const totalResolved = semgrepDiff.resolvedCount + gitleaksDiff.resolvedCount + trivyDiff.resolvedCount;
    const totalNew = semgrepDiff.newCount + gitleaksDiff.newCount + trivyDiff.newCount;
    const previousTotal = semgrepDiff.previousTotal + gitleaksDiff.previousTotal + trivyDiff.previousTotal;

    // Summary doc — same upsert-by-projectKey pattern as SonarQubeReport,
    // now with scanId + diff so you can confirm this is fresh data and
    // see exactly what changed since the last run.
    const summaryCollection = db.collection(SUMMARY_COLLECTION);
    await summaryCollection.createIndex({ projectKey: 1 }, { unique: true });
    await summaryCollection.createIndex({ accountId: 1 });
    await summaryCollection.createIndex({ repo_id: 1 });
    await summaryCollection.createIndex({ scanId: 1 });

    // Capture the previous scanId (if any) before we overwrite it.
    const previousSummary = await summaryCollection.findOne({ projectKey });

    await summaryCollection.findOneAndUpdate(
      { projectKey },
      {
        $set: {
          projectKey,
          accountId,
          repo_id,
          branch,
          repo: repoName,
          repoPath: path.resolve(repoPath),
          scanId,
          previousScanId: previousSummary?.scanId ?? null,
          totalFindings: allFindings.length,
          previousTotalFindings: previousTotal,
          findingsByTool: {
            semgrep: semgrepDocs.length,
            gitleaks: gitleaksDocs.length,
            trivy: trivyDocs.length,
          },
          diffVsPreviousScan: {
            resolved: totalResolved,
            new: totalNew,
            byTool: { semgrep: semgrepDiff, gitleaks: gitleaksDiff, trivy: trivyDiff },
          },
          status: "SUCCESS",
          scannedAt,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    console.log(`\nUpserted summary report for projectKey=${projectKey} (scanId=${scanId}) into ${DB_NAME}.${SUMMARY_COLLECTION}`);
    console.log(`Overall: ${previousTotal} -> ${allFindings.length}  (resolved: ${totalResolved}, new: ${totalNew})`);
  } catch (err) {
    try {
      const db = client.db(DB_NAME);
      await db.collection(SUMMARY_COLLECTION).updateOne(
        { projectKey },
        {
          $set: {
            projectKey,
            accountId,
            repo_id,
            branch,
            scanId,
            status: "FAILED",
            error: err.message,
            scannedAt,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
    } catch (_) {
      // best-effort only
    }
    throw err;
  } finally {
    await client.close();
  }
}

saveToMongo()
  .then(() => console.log("Done."))
  .catch((err) => {
    console.error("MongoDB save failed:", err);
    process.exit(1);
  });