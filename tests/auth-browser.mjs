import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/SARANYA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage();
 await page.route('https://rebound.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/auth.mjs')return route.fulfill({contentType:'text/javascript',body:await readFile(new URL('../dist/auth.mjs',import.meta.url),'utf8')});
  if(path==='/api/auth-config')return route.fulfill({json:{enabled:true,url:'https://example.supabase.co',anonKey:'public-test-key'}});
  return route.fulfill({contentType:'text/html',body:'<header><div class="header-end"></div></header><script type="module" src="/auth.mjs"></script>'});
 });
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'text/javascript',body:`export function createClient(){return {auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{},signUp:async()=>{window.calls=(window.calls||0)+1;if(window.failure)throw Error('Network unavailable');return {data:{user:{email:'test@example.com'},session:null},error:window.limited?{code:'over_email_send_rate_limit'}:null};}}};}`}));
 await page.goto('https://rebound.test/');
 await page.locator('#authDialog').waitFor({state:'visible'});
 await page.locator('#emailSignUp').click();
 assert.match(await page.locator('#authStatus').textContent(),/valid email/);
 await page.locator('#authEmail').fill('test@example.com');await page.locator('#authPassword').fill('test-password-only');
 await page.evaluate(()=>window.failure=true);await page.locator('#emailSignUp').click();
 await page.getByText('Network unavailable',{exact:true}).waitFor();assert.equal(await page.locator('#emailSignUp').isEnabled(),true);
 await page.evaluate(()=>window.failure=false);await page.locator('#emailSignUp').click();
 await page.getByText(/You are not signed in yet/).waitFor();assert.equal(await page.locator('#accountButton span').textContent(),'Guest');
 await page.locator('#authPassword').fill('test-password-only');await page.evaluate(()=>window.limited=true);await page.locator('#emailSignUp').click();
 await page.getByText(/Confirmation emails are temporarily limited/).waitFor();
 console.log('Signup browser checks passed: validation, network failure recovery, pending confirmation, email rate limits.');
}finally{await browser.close();}
