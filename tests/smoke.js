/* Test de fumée : parcourt l'app dans Chromium, clique partout au hasard et signale toute erreur JS.
   Usage : node tests/smoke.js [iterations] [seed]   (serveur http sur le dossier du projet, port 8765) */
const { chromium } = require('/opt/node-tools/node_modules/playwright-core');
const N = +process.argv[2] || 400; let seed = +process.argv[3] || 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const BASE = process.env.BASE || 'http://localhost:8765/';
const today = new Date(), iso = d => d.toISOString().slice(0, 10);
const from = iso(new Date(today - 3 * 864e5)), to = iso(new Date(+today + 6 * 864e5));
const FLYERS = [{id: 1, merchant: 'IGA', categories_csv: 'Épicerie', valid_from: from, valid_to: to}, {id: 2, merchant: 'Maxi', categories_csv: 'Groceries', valid_from: from, valid_to: to}, {id: 3, merchant: 'Pizza Pizza', categories_csv: 'Restaurants', valid_from: from, valid_to: to}];
const ITEMS = {1: [['Poitrines de poulet désossées', 3.99, 40], ['Boeuf haché maigre', 4.44, 30], ['Pommes de terre sac 10 lb', 2.99, 50], ['Fromage cheddar 400 g', 4.99, 45], ['Lait 2% 4 L', 5.49, 10], ['Shampoing Pantene', 3.99, 50]],
  2: [['Porc haché', 2.99, 35], ['Saumon atlantique filets', 9.99, 20], ['Pâtes Catelli 900 g', 1.49, 50], ['Oignons jaunes sac 3 lb', 1.99, 30], ['Tomates en dés 796 ml', 0.99, 50]]};
const serveur = require('./serveur');
(async () => {
  const srv = await serveur();
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(() => chromium.launch());
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write']});
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if(m.type() === 'error' && !/fonts\.g|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.route(/backflipp/, r => { const u = r.request().url(); const m = u.match(/flyers\/(\d+)/);
    const body = m ? (ITEMS[m[1]] || []).map(([name, price, discount], i) => ({id: i, name, price, discount, valid_from: from, valid_to: to})) : FLYERS;
    r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body)}); });
  if(process.env.STATE) await page.addInitScript(s => { if(!localStorage.getItem('menu_epicerie_v1')) localStorage.setItem('menu_epicerie_v1', s); }, require('fs').readFileSync(process.env.STATE, 'utf8'));
  await page.goto(BASE); await page.waitForTimeout(300);
  /* configuration initiale */
  const cp = page.locator('[data-cp]:visible'); if(await cp.count()){ await cp.first().fill('G1V 4M7'); await cp.first().dispatchEvent('change');
    for(const s of ['IGA', 'Maxi']){ const c = page.locator(`[data-store="${s}"]`).first(); if(await c.count()) await c.check({force: true}); }
    const ess = page.locator('#su_ess'); if(await ess.count()) await ess.check({force: true});
    await page.click('#setup_done'); }
  const log = [];
  for(let k = 0; k < N; k++){
    const cookOpen = await page.locator('#cook:not([hidden])').count();
    if(!cookOpen && rnd() < .08){ const tabs = await page.locator('#tabs button').all(); await tabs[Math.floor(rnd() * tabs.length)].click({timeout: 2000}).catch(() => {}); }
    const els = await page.locator(cookOpen ? '#cook button:visible, #cook input:visible' : 'section:not([hidden]) button:visible, section:not([hidden]) a[data-a]:visible, section:not([hidden]) input[type=checkbox]:visible, section:not([hidden]) select:visible, section:not([hidden]) input[type=text]:visible, section:not([hidden]) input[type=number]:visible, section:not([hidden]) textarea:visible').all();
    if(!els.length) continue;
    const el = els[Math.floor(rnd() * els.length)];
    try{
      const desc = await el.evaluate(e => e.tagName + '#' + e.id + '[' + (e.dataset.a || '') + '] ' + (e.textContent || e.value || '').trim().slice(0, 40));
      if(/exportFile|Exporter un fichier|Restaurer|file/i.test(desc)) continue;
      log.push(desc);
      const tag = await el.evaluate(e => e.tagName + ':' + (e.type || ''));
      if(tag.startsWith('SELECT')){ const opts = await el.locator('option').all(); if(opts.length){ const v = await opts[Math.floor(rnd() * opts.length)].getAttribute('value') ?? await opts[0].textContent(); await el.selectOption(v === null ? {index: 0} : v, {timeout: 1500}); } }
      else if(/text|number|TEXTAREA/.test(tag)){ const vals = ['2', 'poulet', '', '0', '-3', '<b>x</b>', '1,5', '9999', 'Pâtes à la viande']; await el.fill(vals[Math.floor(rnd() * vals.length)], {timeout: 1500}); await el.dispatchEvent('input'); await el.dispatchEvent('change'); }
      else await el.click({timeout: 1500, force: tag.startsWith("INPUT:checkbox")});
    }catch(e){ if(!/Timeout|detached|not attached|intercepts|not visible|outside of the viewport|Element is not/.test(e.message)) errs.push('pw: ' + e.message.split('\n')[0]); }
    await page.waitForTimeout(rnd() < .1 ? 600 : 15);
    if(errs.length){ console.log('ERREUR après :', log.slice(-6).join(' → ')); break; }
  }
  const st = await page.evaluate(() => localStorage.getItem('menu_epicerie_v1'));
  try{ JSON.parse(st); }catch(e){ errs.push('état illisible'); }
  console.log(errs.length ? errs.join('\n') : `OK : ${log.length} actions sans erreur (seed ${process.argv[3] || 1})`);
  if(process.env.DUMP) require('fs').writeFileSync(process.env.DUMP, st || '');
  await b.close(); if(srv) srv.close(); process.exit(errs.length ? 1 : 0);
})();
