/* Mise à jour réelle : l'ancienne version (dossier RACINE_VIEUX) crée des données, la nouvelle doit les garder. */
const { chromium } = (() => { try{ return require('playwright-core'); }catch(e){ return require('/opt/node-tools/node_modules/playwright-core'); } })();
const http = require('http');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({serviceWorkers: 'block'}); const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await ctx.route(/fonts\.(googleapis|gstatic)|backflipp/, r => r.abort());
  process.env.RACINE = process.env.RACINE_VIEUX; delete require.cache[require.resolve('./serveur')];
  let srv = await require('./serveur')();
  await page.goto('http://localhost:8765/index.html');
  const avant = await page.evaluate(() => { S.setup = true; S.stores = ['IGA']; S.cp = 'G6V6Z3'; S.p.budget = 180; genMenu(); S.stock['riz|g'] = {name:'Riz', u:'g', q:900, rayon:'épicerie'}; S.fav['Pâté chinois'] = true; save(); return {menu: S.menu.items.map(x => x.r), budget: S.p.budget}; });
  srv.close(); await new Promise(r => setTimeout(r, 300));
  process.env.RACINE = ''; delete require.cache[require.resolve('./serveur')]; srv = await require('./serveur')();
  await page.goto('http://localhost:8765/index.html'); await page.waitForTimeout(400);
  const apres = await page.evaluate(() => ({menu: S.menu.items.map(x => x.r), budget: S.p.budget, riz: !!Object.values(S.stock).find(o => o.name==='Riz'), fav: !!S.fav['Pâté chinois'], copie: readCopies().some(c => c.label==='Avant la mise à jour'), secours: loadFailed}));
  const ok = JSON.stringify(avant.menu) === JSON.stringify(apres.menu) && apres.budget === 180 && apres.riz && apres.fav && apres.copie && !apres.secours && !errs.length;
  console.log(ok ? 'OK : les données de l\'ancienne version sont gardées après la mise à jour' : 'ÉCHEC migration ' + JSON.stringify({avant, apres, errs}));
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})();
