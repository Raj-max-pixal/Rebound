import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/SARANYA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1120}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');await page.getByText('Your comeback, mapped out.').waitFor();
 assert.equal(await page.locator('.session').count(),2);
 await page.screenshot({path:new URL('../submission/desktop.png',import.meta.url).pathname.slice(1),fullPage:true});
 await page.locator('.complete').first().click();assert.equal(await page.locator('#budgetOutput').textContent(),'20');
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.locator('#budgetOutput').textContent(),'45');
 await page.locator('#todayBudget').fill('0');await page.locator('#todayBudget').dispatchEvent('input');await page.getByText('Room to rest.',{exact:true}).waitFor();
 await page.locator('#todayBudget').fill('45');await page.locator('#todayBudget').dispatchEvent('input');
 await page.getByRole('button',{name:'Ask for more time',exact:true}).click();assert.match(await page.locator('#teacherDraft').inputValue(),/minutes do not fit/);await page.locator('#teacherDialog [data-close]').click();
 await page.getByRole('button',{name:'Add assignment',exact:false}).click();await page.locator('#title').fill('<img src=x onerror=alert(1)>');await page.locator('#subject').fill('QA subject');await page.locator('#minutes').fill('30');await page.getByRole('button',{name:'Save assignment',exact:true}).click();
 await page.getByRole('tab',{name:/Assignments/}).click();assert.equal(await page.locator('.assignment').count(),5);assert.equal(await page.locator('#assignments img').count(),0);
 await page.locator('.assignment').last().getByRole('button',{name:'Edit',exact:true}).click();await page.locator('#title').fill('QA edited task');await page.getByRole('button',{name:'Save assignment',exact:true}).click();await page.reload();await page.getByRole('tab',{name:/Assignments/}).click();await page.getByRole('heading',{name:'QA edited task'}).waitFor();
 await page.locator('.assignment').last().getByRole('button',{name:'Remove',exact:true}).click();assert.equal(await page.locator('.assignment').count(),4);
 await page.getByRole('tab',{name:'My catch-up plan',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save backup',exact:true}).click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/rebound-backup/);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:new URL('../submission/mobile.png',import.meta.url).pathname.slice(1),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.getByRole('button',{name:'Start my own plan',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.locator('#taskCount').textContent(),'4');
 await page.getByRole('button',{name:'Start my own plan',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();assert.equal(await page.locator('#taskCount').textContent(),'0');await page.locator('#taskDialog [data-close]').click();
 await page.setViewportSize({width:780,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='32px');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 assert.deepEqual(errors,[]);console.log('Browser checks passed: rendering, completion, undo, rest day, teacher draft, create/edit/delete, XSS escaping, persistence, download, confirmation, mobile layout, enlarged base text. No page errors.');
 await context.close();
} finally {await browser.close();}
