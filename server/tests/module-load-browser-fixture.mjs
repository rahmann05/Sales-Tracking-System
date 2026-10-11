// Isolated browser fixture: reproduces a missing module, then permits the same URL after reload.
// No production API, account, Google provider or business data is accessed.
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const client=fileURLToPath(new URL('../../client/',import.meta.url)),require=createRequire(path.join(client,'package.json'));
const result=await require('esbuild').build({absWorkingDir:client,bundle:true,platform:'browser',format:'esm',write:false,external:['/missing-page.js'],stdin:{resolveDir:client,loader:'jsx',contents:`
import React,{Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {ErrorBoundary} from './src/shared/components/common/ErrorBoundary.jsx';
const previouslyOpened=sessionStorage.getItem('recovery-fixture-opened');
sessionStorage.setItem('recovery-fixture-opened','true');
const Page=React.lazy(()=>import('/missing-page.js'));
createRoot(document.getElementById('root')).render(<ErrorBoundary>{previouslyOpened?<main><h1>Pemulihan berhasil</h1><p>Halaman dimuat ulang dengan versi terbaru.</p></main>:<Suspense fallback={<p>Memuat fixture…</p>}><Page/></Suspense>}</ErrorBoundary>);
`}});
const server=createServer((req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.url==='/fixture.js'){res.setHeader('Content-Type','text/javascript');res.end(result.outputFiles[0].text);}
 else if(req.url==='/missing-page.js'){res.writeHead(404,{'Content-Type':'text/javascript'});res.end('');}
 else if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="id"><meta charset="UTF-8"><title>UAT pemulihan modul</title><div id="root"></div><script type="module" src="/fixture.js"></script></html>');}
 else{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1',()=>console.log('BROWSER_FIXTURE '+JSON.stringify({url:`http://127.0.0.1:${server.address().port}/`,pid:process.pid,scope:'isolated browser recovery, not production failover'})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
