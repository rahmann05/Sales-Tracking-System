import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(root, 'package.json'));
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const files = [];
const failures = [];
const functionBodies = new Map();
let largest = { lines: 0 };

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(jsx|js)$/.test(file)) files.push(file);
  }
}

walk(path.join(root, 'src'));
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  const lines = source.trimEnd().split('\n').length;
  if (lines > largest.lines) largest = { file: relative, lines };
  if (lines > 300) failures.push(`${relative}: ${lines} lines exceeds the 300-line module budget`);
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const components = [];
  traverse(ast, {
    Scope(p) {
      for (const binding of Object.values(p.scope.bindings)) {
        if (binding.scope !== p.scope || binding.referenced || binding.kind === 'module' || binding.kind === 'param') continue;
        if (binding.path.parentPath?.isCatchClause()) continue;
        if (binding.scope.path.isProgram() && binding.path.findParent(q => q.isExportNamedDeclaration() || q.isExportDefaultDeclaration())) continue;
        failures.push(`${relative}:${binding.identifier.loc.start.line}: unused local ${binding.identifier.name}`);
      }
    },
    Function(p) {
      const name = p.node.id?.name || (p.parent.type === 'VariableDeclarator' ? p.parent.id.name : null);
      let renders = false;
      p.traverse({
        JSXElement(q) { renders = true; q.skip(); },
        JSXFragment(q) { renders = true; q.skip(); },
        ReturnStatement(q) { if (q.node.argument?.type === 'NullLiteral' && q.getFunctionParent() === p) renders = true; },
      });
      if (name && /^[A-Z]/.test(name) && renders) components.push(name);
      // Exact substantial bodies; small event handlers and adapters are excluded.
      if (name && p.node.body.type === 'BlockStatement') {
        const body = generate(p.node.body, { comments: false, compact: true }).code;
        if (body.length >= 350) {
          const original = functionBodies.get(body);
          if (original) failures.push(`Duplicate function body: ${relative}:${p.node.loc.start.line} ${name} matches ${original}`);
          else functionBodies.set(body, `${relative}:${p.node.loc.start.line} ${name}`);
        }
      }
    },
    ObjectExpression(p) {
      const keys = new Set();
      for (const property of p.node.properties) {
        if (property.computed || property.type === 'SpreadElement') continue;
        const key = property.key?.name ?? property.key?.value;
        if (keys.has(key)) failures.push(`${relative}:${property.loc.start.line}: repeated object key ${key}`);
        keys.add(key);
      }
    },
  });
  if (components.length > 1) failures.push(`${relative}: one component per file required (${components.join(', ')})`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Frontend architecture passed: ${files.length} modules, one component per file, no substantial exact duplicate functions or repeated object keys. Largest module: ${largest.file} (${largest.lines}/300 lines).`);
}
