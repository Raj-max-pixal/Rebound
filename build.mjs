import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const legacyMark='<span class="brandmark">r<span>↗</span></span>';
const logoMark='<img class="brand-logo" src="rebound-logo.png" alt="" style="width:40px;height:40px;object-fit:contain;flex:none">';
for(const file of ['index.html','focus-area.html','school-hub.html']){
 const filePath='dist/'+file;
 const source=fs.readFileSync(filePath,'utf8');
 let updated=source.replaceAll(legacyMark,logoMark).replaceAll('<img class="brand-logo" src="rebound-logo.png" alt="">',logoMark);
 updated=updated.replace(/(?:<link rel="stylesheet" href="mobile.css">)+/g,'');
 updated=updated.replace('</head>','<link rel="stylesheet" href="mobile.css"></head>');
 if(!updated.includes('mobile-shell.mjs')) updated=updated.replace('</head>','<script type="module" src="mobile-shell.mjs"></script></head>');
 if(!updated.includes('guard-mobile.mjs')) updated=updated.replace('</head>','<script type="module" src="guard-mobile.mjs"></script></head>');
 if(file==='index.html')updated=updated.replace(/<link rel="icon"[^>]*>/,'<link rel="icon" type="image/png" href="rebound-logo.png">');
 else updated=updated.replace('<head>','<head><link rel="icon" type="image/png" href="rebound-logo.png">');
 if(updated!==source)fs.writeFileSync(filePath,updated);
}
const assets={};const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.zip':'application/zip'};
for(const file of fs.readdirSync('dist'))if(fs.statSync('dist/'+file).isFile()&&mime[path.extname(file)])assets['/'+file]={mime:mime[path.extname(file)],body:fs.readFileSync('dist/'+file).toString('base64')};
const code=`import {api} from './server/api.mjs';const assets=${JSON.stringify(assets)};export default {async fetch(request,env){const p=new URL(request.url).pathname;if(p.startsWith('/api/'))return api(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const a=assets[p==='/'?'/index.html':p];if(!a)return new Response('Not found',{status:404});return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(a.body),c=>c.charCodeAt(0)),{headers:{'Content-Type':a.mime,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});}};`;
await build({stdin:{contents:code,resolveDir:process.cwd(),sourcefile:'worker-entry.mjs'},outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
fs.mkdirSync('dist/.openai',{recursive:true});fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});console.log('Built portable Worker with embedded assets and D1 migrations.');
