import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] || "src");
const DRY = process.argv.includes("--dry");

const FEATURE_TO_PAGE = {
  "admin": "Admin",
  "auth": "Login",
  "daily-call-monitor": "DailyCallMonitor",
  "dashboard": "Dashboard",
  "driver": "Driver",
  "home": "Home",
  "outlet-approval": "OutletApproval",
  "outlet-management": "OutletManagement",
  "outlet-registration": "OutletRegistration",
  "outlet-registration-report": "OutletRegistrationReport",
  "outlet-validation": "OutletValidation",
  "reports": "Reports",
  "route-planning": "RoutePlanning",
  "sales": "Sales",
  "supervisor": "Supervisor",
  "team-tracking": "TeamTracking",
  "warehouse": "Warehouse",
};

const toPosix = (p) => p.split(path.sep).join("/");
const relSrc = (abs) => toPosix(path.relative(SRC, abs));

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e.name)) files.push(p);
  }
})(SRC);
const oldSet = new Set(files.map((f) => relSrc(f)));

const mapPath = (rel) => {
  const m = rel.match(/^features\/([a-z0-9-]+)\/(.+)$/);
  if (!m) return rel;
  const page = FEATURE_TO_PAGE[m[1]];
  if (!page) return rel;
  const rest = m[2];
  const segs = rest.split("/");
  const first = segs[0];
  if (first === "components" || first === "hooks") return "pages/" + page + "/" + rest;
  if (segs.length === 1) {
    const name = segs[0];
    const base = name.replace(/\.(js|jsx)$/, "");
    if (base.endsWith("Page") || base.endsWith("View") || name.endsWith(".jsx")) return "pages/" + page + "/" + name;
    if (/^use[A-Z]/.test(base)) return "pages/" + page + "/hooks/" + name;
    return "pages/" + page + "/components/" + name;
  }
  return "pages/" + page + "/components/" + rest;
};

const oldToNew = new Map();
for (const f of files) { const r = relSrc(f); oldToNew.set(r, mapPath(r)); }

const tryResolve = (fromRel, spec) => {
  const base = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec)));
  const candidates = [base, base + ".js", base + ".jsx", base + ".css", base + ".json", base + "/index.js", base + "/index.jsx"];
  for (const c of candidates) if (oldSet.has(c) || fs.existsSync(path.join(SRC, c))) return c;
  return null;
};

const SRC_POSIX = toPosix(SRC);
const drivePart = SRC_POSIX.split("/")[0]; // e.g. G:
// matches specifiers containing an absolute win path to src, possibly after ../../ junk
const BAD_ABS_RE = new RegExp("([\x27\x22])(?:\.\./)*" + drivePart.replace(":", "") + ":/SINAR%20ANUGRAH/client/src/([^\x27\x22]+?)\\1", "g");
const BAD_ABS_RE2 = new RegExp("([\x27\x22])(?:\.\./)*[A-Za-z]:/SINAR(?:%20| )ANUGRAH/client/src/([^\x27\x22]+?)\\1", "g");

const SPEC_RE = /(?:import|export)\s[^\x27\x22;]*?\sfrom\s*([\x27\x22])([^\x27\x22]+)\1|import\s*([\x27\x22])([^\x27\x22]+)\1|import\s*\(\s*([\x27\x22])([^\x27\x22]+)\1\s*\)/g;

const unresolved = [];
const absFixed = [];
const rewrites = new Map();

const fixAbsSpecifier = (full, quote, rest, newRel) => {
  const targetRel = rest;
  const newTarget = oldToNew.get(targetRel) || targetRel;
  let newSpec = toPosix(path.posix.relative(path.posix.dirname(newRel), newTarget));
  if (!newSpec.startsWith(".")) newSpec = "./" + newSpec;
  const origHadExt = /\.[a-z]+$/.test(rest);
  if (!origHadExt) newSpec = newSpec.replace(/\/(index)\.(js|jsx)$/, "").replace(/\.(js|jsx)$/, "");
  absFixed.push(newRel + " : " + rest + " => " + newSpec);
  return quote + newSpec + quote;
};

for (const f of files) {
  const oldRel = relSrc(f);
  const newRel = oldToNew.get(oldRel);
  let content = fs.readFileSync(f, "utf8");

  content = content.replace(BAD_ABS_RE2, (full, q, rest) => fixAbsSpecifier(full, q, rest, newRel));

  content = content.replace(SPEC_RE, (full, q1, s1, q2, s2, q3, s3) => {
    const spec = s1 || s2 || s3;
    if (!spec.startsWith(".")) return full;
    const target = tryResolve(oldRel, spec);
    if (!target) { unresolved.push(oldRel + " -> " + spec); return full; }
    const newTarget = oldToNew.get(target) || target;
    let newSpec = toPosix(path.posix.relative(path.posix.dirname(newRel), newTarget));
    if (!newSpec.startsWith(".")) newSpec = "./" + newSpec;
    const origHadExt = /\.[a-z]+$/.test(spec);
    if (!origHadExt) newSpec = newSpec.replace(/\/(index)\.(js|jsx)$/, "").replace(/\.(js|jsx)$/, "");
    if (newSpec === spec) return full;
    return full.replace(spec, newSpec);
  });

  rewrites.set(oldRel, { newRel, content });
}

if (unresolved.length) { console.log("UNRESOLVED:"); unresolved.forEach((u) => console.log("  " + u)); }
if (absFixed.length) { console.log("ABS PATH FIXED: " + absFixed.length); absFixed.slice(0, 20).forEach((a) => console.log("  " + a)); }

let moved = 0, rewritten = 0;
for (const [oldRel, { newRel, content }] of rewrites) {
  const oldAbs = path.join(SRC, oldRel);
  const newAbs = path.join(SRC, newRel);
  const orig = fs.readFileSync(oldAbs, "utf8");
  const changed = orig !== content;
  if (oldRel !== newRel) moved++;
  if (changed) rewritten++;
  if (DRY) continue;
  fs.mkdirSync(path.dirname(newAbs), { recursive: true });
  if (changed || oldRel !== newRel) fs.writeFileSync(newAbs, content);
  if (oldRel !== newRel) fs.rmSync(oldAbs);
}

if (!DRY) {
  const dirs = [];
  (function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { walk(p); dirs.push(p); } } })(SRC);
  for (const d of dirs.reverse()) { try { fs.rmdirSync(d); } catch {} }
}

console.log("Files scanned: " + files.length + ", moved: " + moved + ", rewritten: " + rewritten + (DRY ? " (DRY RUN)" : ""));
