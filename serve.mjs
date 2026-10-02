import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const allowed={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.mjs':'app.mjs','/planner.mjs':'planner.mjs'};
http.createServer(async(req,res)=>{const p=new URL(req.url,'http://localhost').pathname;const file=allowed[p];if(!file){res.writeHead(404);return res.end('Not found');}try{const content=await readFile(fileURLToPath(new URL('./dist/'+file,import.meta.url)));res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript','Cache-Control':'no-store'});res.end(content);}catch{res.writeHead(500);res.end('Could not load file');}}).listen(4173,'127.0.0.1',()=>console.log('Rebound preview: http://127.0.0.1:4173'));
