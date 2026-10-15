/* Évalue l'association spéciaux ↔ articles sur de vraies circulaires (tests/donnees/*.json).
   Usage : node tests/matching.js [sortie.txt]   — écrit, pour chaque article du catalogue et chaque mot-clé de recette, les spéciaux associés. */
const { chromium } = (() => { try{ return require('playwright-core'); }catch(e){ return require('/opt/node-tools/node_modules/playwright-core'); } })();
const fs = require('fs');
const corpus = JSON.parse(fs.readFileSync(__dirname + '/donnees/circulaires-2026-10-15.json', 'utf8'));
const serveur = require('./serveur');
(async () => {
  const srv = await serveur();
  const b = await chromium.launch(); const page = await b.newPage();
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.goto('http://localhost:8765/index.html');
  const res = await page.evaluate(corpus => {
    const stores = [...new Set(corpus.map(x => x[0]))];
    S.stores = stores.map(s => marchand(s) || s); S.storesx = stores.filter(s => !marchand(s)); S.stores = [...new Set(S.stores)];
    S.auto = {items: corpus.filter(x => x[2]).map(([m, t, p, d]) => ({s: marchand(m) || m, t, p: (+p).toFixed(2).replace('.', ',') + ' $', vf: '', vt: '', d})), maj: isoToday(), src: ''};
    render();
    const out = {art: {}, rec: {}};
    const P = prep(allSpec());
    catalog().forEach(c => { const L = dealCands(c.n, P); if(L.length) out.art[c.n] = L.map(s => s.t); });
    allRecipes().forEach(r => { const d = dealsOf(r); if(d.length) out.rec[r.n] = d.map(x => x.mot + ' → ' + x.hit.t); });
    out.aub = aubaines().map(x => x.s.t + ' −' + x.disc + '%');
    return out;
  }, corpus);
  const lines = [];
  Object.entries(res.art).sort().forEach(([k, L]) => { lines.push('## ' + k + ' (' + L.length + ')'); L.forEach(t => lines.push('   ' + t)); });
  lines.push('', '#### RECETTES'); Object.entries(res.rec).sort().forEach(([k, L]) => { lines.push('## ' + k); L.forEach(t => lines.push('   ' + t)); });
  lines.push('', '#### AUBAINES', ...res.aub);
  fs.writeFileSync(process.argv[2] || '/dev/stdout', lines.join('\n') + '\n');
  console.error('articles associés :', Object.keys(res.art).length, '· recettes avec spécial :', Object.keys(res.rec).length);
  await b.close(); if(srv) srv.close();
})();
