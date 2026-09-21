import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || "src/modules");

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();

function scanTemplate(src, i) {
  // src[i] === "`"
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === "\\") { j += 2; continue; }
    if (c === "`") return j + 1;
    if (c === "$" && src[j + 1] === "{") {
      let depth = 0;
      let k = j + 1;
      while (k < src.length) {
        const cc = src[k];
        if (cc === "\x27" || cc === "\x22" || cc === "`") { k = cc === "`" ? scanTemplate(src, k) : scanString(src, k); continue; }
        if (cc === "{") depth++;
        if (cc === "}") { depth--; if (depth === 0) { k++; break; } }
        k++;
      }
      j = k; continue;
    }
    j++;
  }
  return j;
}

function scanString(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === "\\") { j += 2; continue; }
    if (src[j] === q) return j + 1;
    if (src[j] === "\n" && q !== "`") return j;
    j++;
  }
  return j;
}

function splitTopLevel(body) {
  const items = [];
  let i = 0;
  const n = body.length;
  let pending = "";
  const isWs = (c) => /\s/.test(c);
  while (i < n) {
    while (i < n) {
      const c = body[i];
      if (isWs(c)) { pending += c; i++; continue; }
      if (c === "/" && body[i + 1] === "/") {
        let end = body.indexOf("\n", i);
        if (end === -1) end = n; else end += 1;
        pending += body.slice(i, end); i = end; continue;
      }
      if (c === "/" && body[i + 1] === "*") {
        const end = body.indexOf("*/", i + 2);
        pending += body.slice(i, end + 2); i = end + 2; continue;
      }
      break;
    }
    if (i >= n) break;
    let depth = 0;
    let stmt = "";
    let done = false;
    while (i < n && !done) {
      const c = body[i];
      if (c === "\x27" || c === "\x22") { const e = scanString(body, i); stmt += body.slice(i, e); i = e; continue; }
      if (c === "`") { const e = scanTemplate(body, i); stmt += body.slice(i, e); i = e; continue; }
      if (c === "/" && body[i + 1] === "/") { let e = body.indexOf("\n", i); if (e === -1) e = n; else e += 1; stmt += body.slice(i, e); i = e; continue; }
      if (c === "/" && body[i + 1] === "*") { const e = body.indexOf("*/", i + 2); stmt += body.slice(i, e + 2); i = e + 2; continue; }
      if (c === "(" || c === "[" || c === "{") depth++;
      if (c === ")" || c === "]" || c === "}") depth--;
      stmt += c; i++;
      if (depth === 0) {
        if (c === ";") done = true;
        else if (c === "}") {
          let k = i;
          while (k < n && (body[k] === " " || body[k] === "\t" || body[k] === "\r" || body[k] === "\n")) k++;
          const rest = body.slice(k, k + 12);
          if (k >= n || /^(export\b|const\b|function\b|async\b|let\b|var\b|\/\/|\/\*)/.test(rest)) done = true;
        }
      }
    }
    const trimmed = stmt.trim();
    if (trimmed) items.push({ leading: pending, code: stmt.trimEnd() });
    pending = "";
  }
  return items;
}

function parseImportBindings(stmt) {
  const m = stmt.match(/import\s+([\s\S]*?)\s+from\s*[\x27\x22][^\x27\x22]+[\x27\x22]/);
  if (!m) return { bindings: [], specifier: (stmt.match(/[\x27\x22]([^\x27\x22]+)[\x27\x22]/) || [])[1] };
  const clause = m[1].trim();
  const bindings = [];
  const ns = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (ns) bindings.push(ns[1]);
  const def = clause.match(/^([A-Za-z_$][\w$]*)\s*(,|$)/);
  if (def) bindings.push(def[1]);
  const named = clause.match(/\{([\s\S]*?)\}/);
  if (named) {
    named[1].split(",").forEach((part) => {
      const p = part.trim();
      if (!p) return;
      const asM = p.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
      bindings.push(asM ? asM[1] : p.split(/\s+/)[0]);
    });
  }
  const specM = stmt.match(/from\s*([\x27\x22])([^\x27\x22]+)\1/);
  return { bindings, specifier: specM ? specM[2] : null };
}

const usedIn = (code, name) => new RegExp("\\b" + name.replace(/[$]/g, "\\$&") + "\\b").test(code);

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== "services") walk(p); continue; }
    if (entry.name.endsWith(".service.js")) files.push(p);
  }
})(ROOT);

let splitCount = 0;
const report = [];

for (const file of files) {
  const dir = path.dirname(file);
  const base = path.basename(file, ".service.js");
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

  // extract import statements (line-based, multiline aware)
  const lines = raw.split("\n");
  const imports = [];
  const bodyLines = [];
  let inImport = false;
  let buf = "";
  for (const line of lines) {
    if (!inImport && /^import\s/.test(line)) {
      inImport = true; buf = line;
      if (/from\s*[\x27\x22][^\x27\x22]+[\x27\x22];?\s*$/.test(line) || /^import\s*[\x27\x22][^\x27\x22]+[\x27\x22];?\s*$/.test(line)) {
        imports.push(buf); inImport = false; buf = "";
      }
      continue;
    }
    if (inImport) {
      buf += "\n" + line;
      if (/from\s*[\x27\x22][^\x27\x22]+[\x27\x22];?\s*$/.test(line)) { imports.push(buf); inImport = false; buf = ""; }
      continue;
    }
    bodyLines.push(line);
  }
  const body = bodyLines.join("\n");
  const parsedImports = imports.map((stmt) => ({ stmt, ...parseImportBindings(stmt) }));

  const items = splitTopLevel(body);
  const exported = [];
  const helpers = [];
  const others = [];
  for (const it of items) {
    const code = it.code;
    let m = code.match(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/) || code.match(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) { exported.push({ name: m[1], leading: it.leading, code }); continue; }
    m = code.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/) || code.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) { helpers.push({ name: m[1], leading: it.leading, code }); continue; }
    others.push(it);
  }

  if (exported.length <= 1 && helpers.length === 0) { report.push(`SKIP (already SRP): ${path.relative(ROOT, file)}`); continue; }

  const servicesDir = path.join(dir, "services");
  fs.mkdirSync(servicesDir, { recursive: true });

  const deepen = (spec) => {
    if (!spec || !spec.startsWith(".")) return spec;
    if (spec.startsWith("./")) return "../" + spec.slice(2);
    return "../" + spec;
  };
  const rewriteImport = (imp) => {
    if (!imp.specifier || !imp.specifier.startsWith(".")) return imp.stmt;
    return imp.stmt.replace(/([\x27\x22])([^\x27\x22]+)\1/, (mm, q, s) => q + deepen(s) + q);
  };

  // helpers file (all helpers share one file)
  let helpersFile = null;
  if (helpers.length > 0 || others.length > 0) {
    helpersFile = base + ".helpers.js";
    const helperCode = helpers.map((h) => h.code).join("\n\n") + (others.length ? "\n\n" + others.map((o) => (o.leading + o.code).trim()).join("\n\n") : "");
    const needed = parsedImports.filter((imp) => imp.bindings.some((b) => usedIn(helperCode, b)) || imp.bindings.length === 0);
    const helperHeader = needed.map((imp) => rewriteImport(imp)).join("\n");
    const helperBody = helpers.map((h) => {
      const c = h.code;
      const exp = c.replace(/^(const|let|var|async function|function)/, (mm) => mm);
      return (h.leading ? h.leading.trim() + "\n" : "") + "export " + exp;
    }).join("\n\n");
    const othersBody = others.map((o) => (o.leading + o.code).trim()).join("\n\n");
    fs.writeFileSync(path.join(servicesDir, helpersFile),
      "/** Shared helpers for " + base + " services (internal). */\n" +
      (helperHeader ? helperHeader + "\n\n" : "") + helperBody + (othersBody ? "\n\n" + othersBody : "") + "\n");
  }

  // one file per exported function
  const barrelLines = [];
  for (const ex of exported) {
    const fname = kebab(ex.name) + ".service.js";
    const usedHelpers = helpers.filter((h) => usedIn(ex.code, h.name));
    const usedExports = exported.filter((o) => o.name !== ex.name && usedIn(ex.code, o.name));
    const neededImports = parsedImports.filter((imp) => imp.bindings.some((b) => usedIn(ex.code, b)) || imp.bindings.length === 0);
    const importLines = neededImports.map((imp) => rewriteImport(imp));
    if (usedHelpers.length) importLines.push("import { " + usedHelpers.map((h) => h.name).join(", ") + " } from \x27./" + helpersFile + "\x27;");
    for (const ue of usedExports) importLines.push("import { " + ue.name + " } from \x27./" + kebab(ue.name) + ".service.js\x27;");
    const content =
      "/** " + ex.name + " - single-responsibility service (extracted from " + base + ".service.js). */\n" +
      (importLines.length ? importLines.join("\n") + "\n\n" : "") +
      (ex.leading ? ex.leading.trim() + "\n" : "") + ex.code + "\n";
    fs.writeFileSync(path.join(servicesDir, fname), content);
    barrelLines.push("export { " + ex.name + " } from \x27./services/" + fname + "\x27;");
    splitCount++;
  }

  fs.writeFileSync(file,
    "/**\n * " + base + ".service.js - BARREL (SRP refactor).\n" +
    " * Each business logic lives in its own file under ./services/.\n" +
    " * This file only re-exports to keep existing import paths stable.\n */\n" +
    barrelLines.join("\n") + "\n");
  report.push(`SPLIT ${path.relative(ROOT, file)} -> ${exported.length} services` + (helpersFile ? " + helpers" : ""));
}

console.log(report.join("\n"));
console.log(`\nTotal split service files created: ${splitCount}`);
