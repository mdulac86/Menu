/* Mesure le temps des opérations lourdes avec 600 vrais spéciaux, processeur ralenti ×4 (≈ téléphone). */
const { chromium } = (() => { try{ return require('playwright-core'); }catch(e){ return require('/opt/node-tools/node_modules/playwright-core'); } })();
const fs = require('fs'); const serveur = require('./serveur');
const corpus = JSON.parse(fs.readFileSync(__dirname + '/donnees/circulaires-2026-10-15.json', 'utf8'));
(async () => {
  const srv = await serveur(); const b = await chromium.launch(); const page = await b.newPage();
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.goto('http://localhost:8765/index.html');
  const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  const res = await page.evaluate(corpus => {
    S.stores = [...new Set(corpus.map(x => marchand(x[0]) || x[0]))]; S.setup = true; S.p.budget = 0;
    S.auto = {items: corpus.filter(x => x[2]).slice(0, 600).map(([m, t, p, d]) => ({s: marchand(m) || m, t, p: (+p).toFixed(2).replace('.', ',') + ' $', vf: '', vt: '', d})), maj: isoToday(), src: ''};
    resetCaches();
    const T = f => { const t = performance.now(); f(); return Math.round(performance.now() - t); };
    const gen = T(() => genMenu()), red = T(() => { resetCaches(); render(); });
    tab = 'epicerie'; const epi = T(() => { resetCaches(); render(); });
    const tot = listTotals(buyList().rows).cost; S.p.budget = Math.round(tot * .7);
    const bf = T(() => budgetFit());
    return {creerMenu: gen, rendu: red, epicerie: epi, budget: bf};
  }, corpus);
  console.log('Temps (ms, processeur ×4) :', JSON.stringify(res));
  await b.close(); if(srv) srv.close();
})();
