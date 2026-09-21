import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] || "src");
const DRY = process.argv.includes("--dry");

// oldPrefix (posix, relative to src) -> newPrefix
const MOVES = [
  ["pages/Admin", "features/admin"],
  ["pages/DailyCallMonitor", "features/daily-call-monitor"],
  ["pages/Dashboard", "features/dashboard"],
  ["pages/Driver", "features/driver"],
  ["pages/Login", "features/auth"],
  ["pages/OutletApproval", "features/outlet-approval"],
  ["pages/OutletManagement", "features/outlet-management"],
  ["pages/OutletRegistrationReport", "features/outlet-registration-report"],
  ["pages/OutletRegistration", "features/outlet-registration"],
  ["pages/OutletValidation", "features/outlet-validation"],
  ["pages/Reports", "features/reports"],
  ["pages/RoutePlanning", "features/route-planning"],
  ["pages/Sales", "features/sales"],
  ["pages/Supervisor", "features/supervisor"],
  ["pages/TeamTracking", "features/team-tracking"],
  ["pages/Warehouse", "features/warehouse"],
  ["pages/Home.jsx", "features/home/HomePage.jsx"],
  ["hooks/useAdminActions.js", "features/admin/hooks/useAdminActions.js"],
  ["hooks/useOutletLockStatus.js", "features/sales/hooks/useOutletLockStatus.js"],
  ["hooks/useSalesActions.js", "features/sales/hooks/useSalesActions.js"],
  ["hooks/useSupervisorActions.js", "features/supervisor/hooks/useSupervisorActions.js"],
  ["hooks/useRjpManagement.js", "features/route-planning/hooks/useRjpManagement.js"],
  ["hooks/useSupervisorRollingMatrix.js", "features/route-planning/hooks/useSupervisorRollingMatrix.js"],
  ["hooks/useLogisticsDispatch.js", "features/warehouse/hooks/useLogisticsDispatch.js"],
  ["hooks/useVehicleManagement.js", "features/warehouse/hooks/useVehicleManagement.js"],
].sort((a, b) => b[0].length - a[0].length); // longest prefix first

const toPosix = (p) => p.split(path.sep).join("/");
const relSrc = (abs) => toPosix(path.relative(SRC, abs));

const mapPath = (rel) => {
  for (const [o, n] of MOVES) {
    if (rel === o) return n;
    if (rel.startsWith(o + "/")) return n + rel.slice(o.length);
  }
  return rel;
};

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e.name)) files.push(p);
  }
})(SRC);

const oldSet = new Set(files.map((f) => relSrc(f)));

const tryResolve = (fromRel, spec) => {
  const base = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec)));
  const candidates = [base, base + ".js", base + ".jsx", base + ".css", base + ".json", base + "/index.js", base + "/index.jsx"];
  for (const c of candidates) if (oldSet.has(c) || fs.existsSync(path.join(SRC, c))) return c;
  return null;
};

const SPEC_RE = /(?:import|export)\s[^\x27\x22;]*?\sfrom\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]|import\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]|import\s*\(\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]\s*\)/g;

const unresolved = [];
const rewrites = new Map();

for (const f of files) {
  const oldRel = relSrc(f);
  const newRel = mapPath(oldRel);
  let content = fs.readFileSync(f, "utf8");
  content = content.replace(SPEC_RE, (full, a, b, c) => {
    const spec = a || b || c;
    if (!spec.startsWith(".")) return full;
    const target = tryResolve(oldRel, spec);
    if (!target) { unresolved.push(oldRel + " -> " + spec); return full; }
    const newTarget = mapPath(target);
    let newSpec = toPosix(path.posix.relative(path.posix.dirname(newRel), newTarget));
    if (!newSpec.startsWith(".")) newSpec = "./" + newSpec;
    const origHadExt = /\.[a-z]+$/.test(spec);
    if (!origHadExt) {
      newSpec = newSpec.replace(/\/(index)\.(js|jsx)$/, "").replace(/\.(js|jsx)$/, "");
    }
    if (newSpec === spec) return full;
    return full.replace(spec, newSpec);
  });
  rewrites.set(oldRel, { newRel, content });
}

if (unresolved.length) {
  console.log("UNRESOLVED (left as-is):");
  unresolved.forEach((u) => console.log("  " + u));
}

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
