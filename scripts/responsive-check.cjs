const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const name = req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0].slice(1);
  if (!['index.html', 'style.css', 'script.js', 'hub.js'].includes(name)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', { 'index.html': 'text/html', 'style.css': 'text/css', 'script.js': 'text/javascript', 'hub.js': 'text/javascript' }[name]);
  res.end(fs.readFileSync(path.join(root, name)));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  console.log('Launching browser');
  const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', timeout: 20000 });
  try {
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      page.setDefaultTimeout(10000);
      console.log(`Checking ${width}px`);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.cell');
      async function checkOverflow(view) {
        const size = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert(size.actual <= size.viewport + 1, `${width}px ${view} overflows: ${JSON.stringify(size)}`);
      }
      await checkOverflow('calendar');
      await page.click('#directory-toggle');
      assert.equal(await page.locator('.app-card').count(), await page.locator('.hub-tab').count());
      await checkOverflow('app directory');
      await page.fill('#directory-search','weather');
      assert.equal(await page.locator('.app-card:visible').count(),1);
      await page.locator('.app-card:visible').click();
      assert(await page.locator('[data-view-panel="weather"]').isVisible());
      await page.click('.hub-tab[data-view="calendar"]');
      if (width <= 940) {
        await page.click('#apps-menu-toggle');
        assert.equal(await page.getAttribute('#apps-menu-toggle', 'aria-expanded'), 'true');
        await checkOverflow('apps menu');
        await page.click('.hub-tab[data-view="weather"]');
        assert.equal(await page.getAttribute('#apps-menu-toggle', 'aria-expanded'), 'false');
        await page.click('.hub-tab[data-view="calendar"]');
        await page.click('#burger');
        assert.equal(await page.getAttribute('#burger', 'aria-expanded'), 'true');
        await page.click('#new-btn');
      } else {
        await page.click('#new-btn');
      }
      await page.fill('#f-title', 'Responsive regression event');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id),'save');
      await page.fill('#f-date', '2026-10-09');
      await page.click('#save');
      assert.equal(await page.locator('#modal').evaluate(el => el.classList.contains('open')), false);
      assert(await page.evaluate(() => Object.values(localStorage).some(value => value.includes('Responsive regression event'))));
      for (const view of ['weather', 'radio', 'calendar']) {
        await page.click(`.hub-tab[data-view="${view}"]`);
        assert(await page.locator(`[data-view-panel="${view}"]`).isVisible());
        await checkOverflow(view);
      }
      assert.deepEqual(errors, [], `${width}px runtime errors`);
      console.log(`PASS ${width}px: layouts, navigation, sidebar, event saving, no JavaScript exceptions`);
      await page.close();
    }
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 500 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    console.log('PASS reduced motion');
    await page.setViewportSize({width:812,height:375});
    await page.click('#burger'); await page.click('#new-btn');
    await page.fill('#f-title','Landscape regression event'); await page.click('#save');
    assert.equal(await page.locator('#modal').evaluate(el=>el.classList.contains('open')),false);
    console.log('PASS landscape dialog remains usable above the radio player');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
