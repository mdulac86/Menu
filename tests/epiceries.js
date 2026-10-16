/* Prix par épicerie et comparateur « Où faire l'épicerie » (version 2.1), sur un écran d'iPhone.
   Usage : node tests/epiceries.js [dossier-captures] */
const { chromium } = (() => { try{ return require('playwright-core'); }catch(e){ return require('/opt/node-tools/node_modules/playwright-core'); } })();
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.env.RACINE || path.join(__dirname, '..'), OUT = process.argv[2] || '';
const corpus = JSON.parse(fs.readFileSync(__dirname + '/donnees/circulaires-2026-10-15.json', 'utf8'));
const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webmanifest':'application/manifest+json'};
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/Menu\/(test\/)?/, '/'); if(p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p); if(!f.startsWith(ROOT) || !fs.existsSync(f)){ r.writeHead(404); return r.end(); } r.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
const iso = d => d.toISOString().slice(0, 10), today = new Date();
(async () => {
  await new Promise(r => srv.listen(8767, r));
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
  await page.goto('http://localhost:8767/Menu/test/'); await page.waitForTimeout(300);
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
  /* l'app choisit l'épicerie la moins chère */
  await page.selectOption('[data-a="goplan"]', 'auto'); await page.waitForTimeout(100);
  await page.click('#prep_week'); await page.waitForFunction(() => S.menu.date, null, {timeout:30000}); await page.waitForTimeout(500);
  const a = await page.evaluate(() => { const rows = buyList().rows, C = comparer(rows);
    const src = {}; ['Maxi','IGA'].forEach(s => { src[s] = {}; rows.forEach(r => { const c = costAt(r, s); src[s][c.src] = (src[s][c.src]||0) + 1; }); });
    const srcW = {}; rows.forEach(r => { const c = costAt(r, 'Walmart'); srcW[c.src] = (srcW[c.src]||0) + 1; });
    return {srcW, go:goStores(), best:C.best.stores, singles:C.singles.map(x => [x.stores[0], Math.round(x.total)]), multi:C.multi.map(x => [x.stores.join('+'), Math.round(x.total)]), flash:(document.querySelector('#flash')||{}).textContent, src, ecIGA:ecart('IGA'), ecW:ecart('Walmart'), pe:!!PE, rows:rows.length,
      tot:listTotals(rows).cost}; });
  console.log(JSON.stringify(a));
  if(process.env.DETAIL) console.log(await page.evaluate((process_env_store) => buyList().rows.map(r => { const m = costAt(r,'Maxi'), i = costAt(r, process_env_store), w = i; return (i.cost < m.cost*0.97 ? '>> ' : '   ') + r.name.padEnd(34) + ' ' + fq(r.buy, r.u).padEnd(9) + ' M ' + m.cost.toFixed(2) + ' ' + m.src + (m.deal ? ' [' + m.deal.t.slice(0,30) + ' ' + m.deal.p + ']' : '') + (m.rsp ? ' {promo}' : '') + ' | I ' + i.cost.toFixed(2) + ' ' + i.src + (i.deal ? ' [' + i.deal.t.slice(0,40) + ' ' + i.deal.p + ']' : '') + (i.rsp ? ' {promo ' + i.rsp.nom.slice(0,30) + '}' : ''); }).join('\n'), process.env.DETAIL));
  ok(a.pe, 'relevé des prix non chargé');
  ok(a.go.length===1 && a.go[0]===a.best[0], 'la liste ne va pas à la moins chère : ' + JSON.stringify(a.go));
  ok(a.singles.length===5, 'comparaison incomplète');
  ok(/Le moins cher cette semaine/.test(a.flash||''), 'résumé sans le choix de l\'épicerie');
  ok((a.src.Maxi.robot||0) >= 8 && (a.src.IGA.robot||0) >= 5, 'peu de prix relevés : ' + JSON.stringify(a.src));
  ok(a.ecIGA > 0.9 && a.ecIGA < 1.45, 'écart IGA : ' + a.ecIGA);
  ok((a.srcW.marque||0) >= 3, 'Walmart sans prix de marque connue : ' + JSON.stringify(a.srcW));
  ok(Math.abs(a.tot - a.singles[0][1]*1) < a.tot*0.2, 'total de la liste et comparateur très différents');
  await shot('20-ma-semaine-auto');
  /* Commander : la ligne « Où aller » */
  await page.click('#tabs button[data-t="epicerie"]'); await page.waitForTimeout(200);
  ok(await page.locator('.ouc:visible').count()===1, 'carte « Où faire l\'épicerie » absente');
  ok(await page.locator('.ouc .item.on').count()===1, 'le choix actuel n\'est pas marqué');
  await shot('21-ou-aller');
  if(a.multi.length){
    await page.locator('.ouc [data-a="ou_pick"]').last().click(); await page.waitForTimeout(200);
    const b2 = await page.evaluate(() => { const rows = buyList().rows; return {go:goStores(), grp:S.p.grp, per:[...new Set(rows.map(storeOf))], h:[...document.querySelectorAll('#tab-epicerie h2.sec')].map(x => x.textContent)}; });
    console.log(JSON.stringify(b2));
    ok(b2.go.length >= 2 && b2.grp==='magasin', 'combinaison non appliquée : ' + JSON.stringify(b2));
    ok(b2.per.length >= 2, 'la liste ne se sépare pas par épicerie');
    await shot('22-liste-par-epicerie');
    /* revenir à une seule épicerie */
    await page.locator('.ouc [data-a="ou_pick"]').first().click(); await page.waitForTimeout(150);
    ok(await page.evaluate(() => goStores().length)===1, 'retour à une épicerie impossible');
  }
  /* Prix : le relevé, le choix du magasin IGA */
  await page.click('[data-a="view"][data-v="prix"]:visible'); await page.waitForTimeout(150);
  ok(await page.locator('[data-a="pe_mag"]').count()===1, 'choix du magasin IGA absent');
  const before = await page.evaluate(() => listTotals(buyList().rows).cost);
  const opts = await page.locator('[data-a="pe_mag"] option').evaluateAll(o => o.map(x => x.value));
  await page.selectOption('[data-a="pe_mag"]', opts[opts.length-1]); await page.waitForTimeout(150);
  ok(await page.evaluate(v => S.pe.iga===v, opts[opts.length-1]), 'magasin IGA non retenu');
  await shot('23-prix-releve');
  ok(await page.locator('small:has-text("Relevé :")').count() > 3, 'prix relevés absents sous les articles');
  /* sans relevé (hors ligne, jamais chargé) : tout fonctionne avec l'estimation */
  const c = await page.evaluate(() => { PE = null; resetCaches(); render(); const C = comparer(buyList().rows); return {n:C.singles.length, t:Math.round(C.best.total)}; });
  ok(c.n===5 && c.t > 20, 'sans relevé : ' + JSON.stringify(c));
  await page.evaluate(() => { peLoad(); resetCaches(); render(); });
  ok(errs.length===0, 'erreurs JavaScript : ' + errs.join(' | '));
  await b.close(); srv.close();
  if(fails.length){ console.log('ÉCHECS :\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('OK : prix par épicerie et comparateur');
})().catch(e => { console.error(e); process.exit(1); });
