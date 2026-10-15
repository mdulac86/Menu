/* Scénario complet d'une semaine (version 2.0), sur un écran d'iPhone, avec de vraies circulaires simulées.
   Usage : node tests/scenario.js [dossier-captures]   (sert le projet sous /Menu/test/ pour tester le canal de test) */
const { chromium } = (() => { try{ return require('playwright-core'); }catch(e){ return require('/opt/node-tools/node_modules/playwright-core'); } })();
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = process.argv[2] || '';
const corpus = JSON.parse(fs.readFileSync(__dirname + '/donnees/circulaires-2026-10-15.json', 'utf8'));
const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webmanifest':'application/manifest+json'};
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/Menu\/(test\/)?/, '/'); if(p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p); if(!f.startsWith(ROOT) || !fs.existsSync(f)){ r.writeHead(404); return r.end(); } r.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
const iso = d => d.toISOString().slice(0, 10), today = new Date();
(async () => {
  await new Promise(r => srv.listen(8766, r));
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:390, height:844}, deviceScaleFactor:2, serviceWorkers:'block', isMobile:true, hasTouch:true});
  const page = await ctx.newPage(); const errs = [], fails = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => { errs.push('dialogue : ' + d.message()); d.dismiss(); });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const merchants = [...new Set(corpus.map(x => x[0]))], vf = iso(new Date(+today - 864e5)), vt = iso(new Date(+today + 12 * 864e5));
  await ctx.route(/backflipp/, r => { const u = r.request().url(), m = u.match(/flyers\/(\d+)/);
    const body = m ? corpus.filter(x => x[0]===merchants[+m[1]]).map(([mm, name, price, discount, sfx], i) => ({id:i, name, price, discount, print_id: sfx ? 'x_' + sfx : null, valid_from:vf, valid_to:vt}))
      : merchants.map((mm, i) => ({id:i, merchant:mm, categories_csv:'Groceries', valid_from:vf+'T00:00:00-04:00', valid_to:vt+'T23:59:59-04:00'}));
    r.fulfill({status:200, contentType:'application/json', body:JSON.stringify(body)}); });
  /* de vraies données familiales existent déjà sur le téléphone : la version de test ne doit pas y toucher */
  await page.addInitScript(() => { if(!localStorage.getItem('menu_epicerie_v1')) localStorage.setItem('menu_epicerie_v1', JSON.stringify({setup:true, stores:['Maxi'], cp:'G6V6Z3', menu:{date:'x', items:[]}, stock:{}, p:{souper:4}})); });
  const shot = async n => { if(OUT){ await page.waitForTimeout(150); await page.screenshot({path:path.join(OUT, n + '.png'), fullPage:true}); } };
  const ok = (c, m) => { if(!c) fails.push(m); };
  await page.goto('http://localhost:8766/Menu/test/'); await page.waitForTimeout(300);
  ok(await page.locator('#testbar:visible').count(), 'bandeau de test absent');
  await shot('01-assistant-famille');
  /* étape 1 : la famille (2 adultes, 2 garçons de 14 et 12 ans, grand appétit) */
  const ages = page.locator('[data-pf="age"]'); await ages.nth(0).fill('14'); await ages.nth(0).dispatchEvent('change'); await ages.nth(1).fill('12'); await ages.nth(1).dispatchEvent('change');
  for(const i of [2, 3]){ await page.locator(`[data-pf="ap"][data-i="${i}"]`).selectOption('grand'); }
  await page.click('[data-a="wiz"][data-v="1"]'); await shot('02-assistant-horaire');
  await page.click('[data-a="wiz"][data-v="1"]');
  await page.fill('[data-cp]', 'G6V 6Z3'); await page.dispatchEvent('[data-cp]', 'change');
  for(const s of ['Maxi', 'IGA', 'Walmart', 'Marché Ami', 'Inter-Marché']){ const c = page.locator(`[data-store="${s}"]`).first(); if(await c.count()) await c.evaluate(el => { if(!el.checked){ el.checked = true; el.dispatchEvent(new Event('change', {bubbles:true})); } }); }
  await page.selectOption('[data-pf="princ"]', 'Maxi'); await shot('03-assistant-epiceries');
  await page.click('[data-a="wiz"][data-v="1"]'); await page.locator('#su_ess').evaluate(el => { el.checked = true; }); await page.click('[data-a="wiz"][data-v="1"]');
  await page.fill('[data-p="budget"]', '275'); await page.dispatchEvent('[data-p="budget"]', 'change'); await page.click('#setup_done');
  const st1 = await page.evaluate(() => ({souper:S.p.souper, restes:S.p.restes, nDin:S.p.nDin, main:S.p.main, keyTest:!!localStorage.getItem('menu_test_v1'), real:JSON.parse(localStorage.getItem('menu_epicerie_v1')).p.souper}));
  ok(st1.souper===5 && st1.restes===5, 'portions du profil : ' + JSON.stringify(st1)); ok(st1.keyTest && st1.real===4, 'canal de test : vraies données touchées');
  await shot('04-ma-semaine-avant');
  /* « Préparer ma semaine » */
  await page.click('#prep_week'); await page.waitForFunction(() => S.menu.date, null, {timeout:30000}); await page.waitForTimeout(400);
  const st2 = await page.evaluate(() => ({start:S.menu.start, shop:S.menu.shop, dowStart:new Date(S.menu.start+'T12:00:00').getDay(), dowShop:new Date(S.menu.shop+'T12:00:00').getDay(), n:mlist('items').length, spec:autoItems().length, cost:listTotals(buyList().rows).cost, budget:S.p.budget, flash:document.querySelector('#flash') && document.querySelector('#flash').textContent, skip:S.skip}));
  ok(st2.dowStart===0 && st2.dowShop===6 && st2.start > st2.shop, 'dates de la semaine : ' + JSON.stringify(st2));
  ok(st2.spec > 20, 'spéciaux non lus : ' + st2.spec); ok(st2.n===6, 'nombre de soupers ' + st2.n); ok(/Menu prêt/.test(st2.flash||''), 'résumé absent');
  ok(st2.cost <= st2.budget * 1.05 || /budget/.test(st2.flash), 'budget : ' + st2.cost);
  await shot('05-ma-semaine-prete');
  /* menu : pourquoi, 3 choix */
  await page.click('#tabs button[data-t="menu"]'); await shot('06-menu');
  ok(await page.locator('.why').count() > 0, '« Pourquoi ce plat » absent');
  const first = page.locator('details.dish, details').filter({has: page.locator('[data-a="malts"]')}).first();
  await first.evaluate(d => d.open = true); await page.locator('[data-a="malts"]').first().click(); await page.waitForTimeout(200);
  const alts = await page.locator('[data-a="mpick"]').count(); ok(alts >= 1, 'aucun autre choix'); await shot('07-autres-choix');
  if(alts){ const before = await page.evaluate(() => mlist('items').map(x => x.r).join('|')); await page.locator('[data-a="mpick"]').first().click(); const after = await page.evaluate(() => mlist('items').map(x => x.r).join('|')); ok(before !== after, 'le choix ne remplace pas le plat'); }
  /* épicerie : commande en ligne */
  await page.click('#tabs button[data-t="epicerie"]'); await page.click('[data-a="cmdmode"][data-v="1"]'); await shot('08-commande');
  ok(await page.locator('a.shopl[href*="maxi.ca"]').count() > 5, 'liens maxi.ca absents');
  for(const v of ['articles', 'prix', 'maison']){ await page.click(`[data-a="view"][data-v="${v}"]:visible`); await shot('09-epicerie-' + v); }
  await page.click('#tabs button[data-t="recettes"]'); await shot('10-recettes');
  await page.click('#tabs button[data-t="profil"]'); for(const v of ['famille', 'horaire', 'epiceries', 'budget', 'sauvegarde', 'apparence', 'aide']){ await page.click(`[data-a="view"][data-v="${v}"]:visible`); await shot('11-profil-' + v); }
  ok(await page.locator('#test_copy, .card.call').count(), 'carte de test absente');
  /* fin de semaine : épicerie faite, total payé, historique */
  await page.evaluate(() => { buyList().rows.forEach(r => S.menu.chk[r.k] = true); epicerieFaite(); S.menu.paid = 268.4; save(); terminerSemaine(); });
  const st3 = await page.evaluate(() => ({h:S.hist.length, est:S.hist.at(-1).est, paid:S.hist.at(-1).paid, shop:S.dates.shop}));
  ok(st3.h===1 && st3.est > 0 && st3.paid===268.4 && !st3.shop, 'historique de la semaine : ' + JSON.stringify(st3));
  await page.click('#tabs button[data-t="semaine"]'); await shot('12-semaine-suivante');
  console.log(errs.length || fails.length ? 'ÉCHECS :\n' + errs.map(e => 'erreur JS : ' + e).concat(fails).join('\n') : 'OK : scénario complet réussi');
  await b.close(); srv.close(); process.exit(errs.length || fails.length ? 1 : 0);
})();
