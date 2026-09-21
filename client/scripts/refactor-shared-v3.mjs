import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] || "src");
const DRY = process.argv.includes("--dry");

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
  if (rel === "components/AppRouter.jsx") return "app/AppRouter.jsx";
  if (rel.startsWith("components/")) return "shared/" + rel;
  if (rel.startsWith("hooks/")) return "shared/" + rel;
  return rel;
};

const oldToNew = new Map();
for (const f of files) { const r = relSrc(f); oldToNew.set(r, mapPath(r)); }

const tryResolve = (fromRel, spec) => {
  const base = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec)));
  const candidates = [base, base + ".js", base + ".jsx", base + ".css", base + ".json", base + "/index.js", base + "/index.jsx"];
  for (const c of candidates) if (oldSet.has(c) || fs.existsSync(path.join(SRC, c))) return c;
  return null;
};

const SPEC_RE = /(?:import|export)\s[^\x27\x22;]*?\sfrom\s*([\x27\x22])([^\x27\x22]+)\1|import\s*([\x27\x22])([^\x27\x22]+)\1|import\s*\(\s*([\x27\x22])([^\x27\x22]+)\1\s*\)/g;

const unresolved = [];
const rewrites = new Map();

for (const f of files) {
  const oldRel = relSrc(f);
  const newRel = oldToNew.get(oldRel);
  let content = fs.readFileSync(f, "utf8");
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
