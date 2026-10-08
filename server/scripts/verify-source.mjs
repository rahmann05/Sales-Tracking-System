import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(path.join(root,'client/package.json'));
const {parse}=require('@babel/parser');const traverse=require('@babel/traverse').default;
const globals=new Set(('Array Object Boolean Number String BigInt Symbol Function Promise Map Set WeakMap WeakSet Date Math JSON Intl RegExp Error TypeError RangeError SyntaxError URIError AggregateError Reflect Proxy NaN Infinity undefined console global setImmediate clearImmediate window document navigator localStorage sessionStorage fetch URL URLSearchParams Blob File FileReader FormData AbortController AbortSignal Headers Request Response HTMLElement HTMLInputElement HTMLCanvasElement HTMLVideoElement IntersectionObserver ResizeObserver MutationObserver Image Audio ImageData Event CustomEvent MouseEvent TouchEvent KeyboardEvent EventTarget Node DOMException TextEncoder TextDecoder atob btoa alert confirm prompt performance crypto structuredClone queueMicrotask requestAnimationFrame cancelAnimationFrame setTimeout clearTimeout setInterval clearInterval self globalThis process Buffer parseInt parseFloat isNaN isFinite encodeURI decodeURI encodeURIComponent decodeURIComponent PromiseRejectionEvent google JSX').split(' '));
const files=[];const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(/\.(m?js|jsx|css)$/.test(file))files.push(file);}};
for(const dir of ['client/src','server/src','shared'])walk(path.join(root,dir));
const modules=new Map();const errors=[];let checked=0;
function resolve(source,file){
 if(!source.startsWith('.'))return null;
 const base=path.resolve(path.dirname(file),source.split('?')[0]);
 return [base,...['.js','.jsx','.mjs','.css','/index.js','/index.jsx'].map(ext=>base+ext)].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
}
for(const file of files){
 const source=fs.readFileSync(file,'utf8');const refs=[];modules.set(file,refs);
 if(file.endsWith('.css')){for(const match of source.matchAll(/@(import|reference)\s+['"]([^'"]+)['"]/g)){const resolved=resolve(match[2],file);if(match[2].startsWith('.')&&!resolved)errors.push(`Missing CSS: ${file} -> ${match[2]}`);if(resolved)refs.push(resolved);}continue;}
 let ast;try{ast=parse(source,{sourceType:'unambiguous',plugins:['jsx']});checked++;}catch(e){errors.push(`Syntax: ${file}:${e.loc?.line} ${e.message}`);continue;}
 traverse(ast,{ImportDeclaration(p){for(const spec of p.node.specifiers)if(spec.local.name!=='React'&&!p.scope.getBinding(spec.local.name)?.referenced)errors.push(`Unused import: ${path.relative(root,file)}:${p.node.loc.start.line} ${spec.local.name}`);const target=resolve(p.node.source.value,file);if(p.node.source.value.startsWith('.')&&!target)errors.push(`Missing import: ${file} -> ${p.node.source.value}`);if(target)refs.push(target);},ExportNamedDeclaration(p){if(p.node.source){const target=resolve(p.node.source.value,file);if(target)refs.push(target);else if(p.node.source.value.startsWith('.'))errors.push(`Missing export: ${file}`);}},CallExpression(p){if(p.node.callee.type==='Import'&&p.node.arguments[0]?.type==='StringLiteral'){const target=resolve(p.node.arguments[0].value,file);if(target)refs.push(target);else errors.push(`Missing dynamic import: ${file}`);}},ReferencedIdentifier(p){if(!p.scope.hasBinding(p.node.name)&&!globals.has(p.node.name))errors.push(`Unbound: ${path.relative(root,file)}:${p.node.loc.start.line} ${p.node.name}`);}});
}
const reached=new Set();function visit(file){if(reached.has(file))return;reached.add(file);for(const child of modules.get(file)||[])visit(child);}
// Each Vite HTML entry owns an import graph, including the isolated design preview.
const clientRoot=path.join(root,'client');
for(const entry of fs.readdirSync(clientRoot).filter(name=>name.endsWith('.html'))){
 const html=fs.readFileSync(path.join(clientRoot,entry),'utf8');
 for(const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)){
  if(!/\btype=["']module["']/.test(match[0])||/^(https?:)?\/\//.test(match[1]))continue;
  const target=path.resolve(clientRoot,match[1].replace(/^\//,''));
  if(!target.startsWith(clientRoot+path.sep)||!modules.has(target))errors.push(`Missing frontend entry: ${entry} -> ${match[1]}`);
  else visit(target);
 }
}
for(const file of files.filter(f=>f.includes(`${path.sep}client${path.sep}`)))if(!reached.has(file))errors.push(`Unreachable frontend: ${path.relative(root,file)}`);
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exitCode=1;}else console.log(`Source verification passed: ${checked} JS modules parsed, all frontend imports reachable, no unused imports, missing references or unbound variables.`);
