// Local-only visual QA of the actual production build with synthetic API responses.
// Run manually: node scripts/sales-ui-check.mjs. Never deploy this fixture server.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixture,user} from './sales-ui-fixtures.mjs';
const port=Number(process.argv[2]||5187);
const root=fileURLToPath(new URL('../../client/dist/',import.meta.url));
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:5187');
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(url.pathname==='/api/v1/auth/login'&&req.method==='POST')return json({success:true,data:{accessToken:'synthetic-local-ui-session',user}});
 if(req.method!=='GET')return json({success:false,message:'Server uji visual: penyimpanan diblokir. Tidak ada koneksi database.'},405);
 if(url.pathname.startsWith('/api/v1/'))return json({success:true,data:fixture(url.pathname.slice(7),url.searchParams)});
 if(url.pathname.startsWith('/socket.io')){res.writeHead(204);return res.end();}
 try{const target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!target.startsWith(root))return json({message:'Not found'},404);const bytes=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{json({message:'Not found'},404);}
});
server.listen(port,'127.0.0.1',()=>process.stdout.write(`Actual frontend visual QA: http://127.0.0.1:${port} (synthetic data, writes blocked)\n`));
