/* Vérifie que l'application s'installe (service worker) et s'ouvre sans connexion. */
const { chromium } = (() => { try{ return require('playwright-core'); }catch(e){ return require('/opt/node-tools/node_modules/playwright-core'); } })();
const serveur = require('./serveur');
(async () => {
  const srv = await serveur();
  const b = await chromium.launch(); const ctx = await b.newContext(); const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.goto('http://localhost:8765/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForTimeout(500);
  const cached = await page.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); return {ks, n: (await c.keys()).length}; });
  await ctx.setOffline(true);
  await page.reload(); await page.waitForTimeout(500);
  const ok = await page.evaluate(() => typeof RECIPES !== 'undefined' && typeof BAREME !== 'undefined' && !!document.querySelector('#tab-semaine').innerHTML.length);
  console.log(JSON.stringify(cached), ok && !errs.length ? 'OK : l\'application s\'ouvre hors ligne' : 'ÉCHEC hors ligne ' + errs.join(' | '));
  await b.close(); if(srv) srv.close(); process.exit(ok && !errs.length ? 0 : 1);
})();
