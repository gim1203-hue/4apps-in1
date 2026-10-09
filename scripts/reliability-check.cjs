const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const name = req.url === '/' ? 'index.html' : req.url.slice(1);
  if (!['index.html','style.css','script.js','hub.js'].includes(name)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(fs.readFileSync(path.join(root, name)));
});
const directory = [{name:'United States',iso2:'US',states:[{name:'New York'}]}];
const pin = fs.readFileSync(path.join(root,'script.js'),'utf8').match(/PIN_CODE\s*=\s*'([^']+)'/)[1];
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:process.env.TEST_BROWSER || 'msedge'});
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await browser.newPage({viewport:{width:390,height:850}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    await page.addInitScript(() => {
      Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success,failure){failure({code:1});}}});
    });
    let weatherAttempts=0, radioAttempts=0;
    await page.route('https://countriesnow.space/**',route => {
      if(route.request().method() === 'POST') return route.fulfill({json:{data:['New York City']}});
      weatherAttempts++;
      return weatherAttempts === 1 ? route.fulfill({status:503,json:{}}) : route.fulfill({json:{data:directory}});
    });
    await page.route('https://de1.api.radio-browser.info/json/**',async route => {
      radioAttempts++;
      if(route.request().url().includes('/countries?')) return route.fulfill({json:[{name:'United States',iso_3166_1:'US',stationcount:1},{name:'Canada',iso_3166_1:'CA',stationcount:1}]});
      const usa=route.request().url().includes('/US?');
      if(usa) await new Promise(resolve=>setTimeout(resolve,300));
      await route.fulfill({json:[{stationuuid:usa?'a':'b',name:usa?'Old selection':'Current selection',url_resolved:'https://example.com/stream',tags:'music',language:'English'}]}).catch(()=>{});
    });
    await page.route('https://www.googleapis.com/**',route=>route.fulfill({json:{items:[]}}));
    await page.route('https://api.themoviedb.org/**',route=>route.fulfill({json:{results:[]}}));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    assert.equal(weatherAttempts,0); assert.equal(radioAttempts,0);
    console.log('PASS unused weather and radio APIs are deferred at startup');
    await page.click('.hub-tab[data-view="weather"]');
    await page.waitForSelector('#wx-retry:visible');
    await page.click('#wx-retry');
    await page.waitForFunction(()=>document.querySelector('#wx-country').options.length>1);
    await page.click('#wx-nearby');
    assert.match(await page.locator('#wx-content').textContent(),/permission was denied/);
    assert.equal(await page.locator('#wx-nearby').isDisabled(),false);
    console.log('PASS weather outage retry and denied location feedback');
    await page.click('.hub-tab[data-view="radio"]');
    await page.selectOption('#country','US');
    await page.selectOption('#country','CA');
    await page.waitForSelector('.station');
    await page.waitForTimeout(400);
    assert.match(await page.locator('#station-list').textContent(),/Current selection/);
    assert.doesNotMatch(await page.locator('#station-list').textContent(),/Old selection/);
    console.log('PASS stale radio responses cannot replace the latest selection');
    await page.click('#iwatch-tab');
    await page.fill('#website-pin-input',pin); await page.click('#website-pin-submit');
    await page.click('#youtube-library-btn');
    await page.locator('#library-import-input').setInputFiles({name:'library.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{id:'dQw4w9WgXcQ',title:'Safe song',thumb:'x"><span data-audit-marker="injected"></span><img src="x'}]))});
    await page.waitForSelector('.library-item');
    assert.equal(await page.locator('[data-audit-marker]').count(),0);
    assert.equal(await page.locator('.library-item img').getAttribute('src'),'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
    await page.locator('#library-import-input').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{id:'invalid',title:{malformed:true}}]))});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.library-item').count(),1);
    console.log('PASS unsafe import fields discarded; invalid imports preserve the Library');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#libraryBackdrop').evaluate(el=>el.classList.contains('open')),false);
    await page.click('.hub-tab[data-view="calendar"]'); await page.click('#burger'); await page.click('#new-btn');
    await page.click('#save');
    assert.match(await page.locator('#event-error').textContent(),/title/);
    await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Storage unavailable');};});
    await page.fill('#f-title','Session-only event'); await page.click('#save');
    assert.match(await page.locator('#storage-notice').textContent(),/could not be saved/);
    console.log('PASS calendar validation and persistent storage failure feedback');
    await page.route('**/hanging',()=>{});
    const aborted = await page.evaluate(async () => {
      const controller=new AbortController(); setTimeout(()=>controller.abort(),30);
      try {await hubRequestJSON('/hanging',{signal:controller.signal}); return false;} catch(e){return e.name === 'AbortError';}
    });
    assert.equal(aborted,true);
    const timedOut = await page.evaluate(async () => {
      const original=window.setTimeout;
      window.setTimeout=(fn,ms,...args)=>original(fn,ms === 15000 ? 30 : ms,...args);
      try {await hubRequestJSON('/hanging'); return false;} catch(e){return e.name === 'AbortError';} finally {window.setTimeout=original;}
    });
    assert.equal(timedOut,true);
    assert.deepEqual(errors,[]);
    console.log('PASS request cancellation, bounded timeout and no uncaught JavaScript exceptions');
  } finally {await browser.close(); server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
