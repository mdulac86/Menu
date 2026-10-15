/* Tests unitaires exécutés dans la vraie page (Chromium) : association spéciaux ↔ articles, prix, analyse de texte.
   Usage : node tests/unit.js   (serveur http sur le dossier du projet, port 8765) */
const { chromium } = (() => { try{ return require('playwright-core'); }catch(e){ return require('/opt/node-tools/node_modules/playwright-core'); } })();
const CASES = {
  /* [article, nom de circulaire, doit correspondre ?] */
  match: [
    ['Oeufs', 'Oeufs Kinder Surprise', false], ['Oeufs', 'KINDER SURPRISE, 3 x 20 G', false], ['Oeufs', 'Mini oeufs Cadbury', false],
    ['Oeufs', 'Oeufs en chocolat de Pâques', false], ['Oeufs', 'Nouilles aux oeufs No Yolks', false], ['Oeufs', "Casserole d'œufs à la sauce tomate", false],
    ['Oeufs', 'GROS OEUFS BLANCS SANS NOM®, 30 UN.', true], ['Oeufs', 'Lovo œufs blancs de poules en liberté', true], ['Oeufs', 'ŒUFS BRUNS BIOLOGIQUES COMPLIMENTS', true],
    ['Poitrines de poulet', 'Poitrines de poulet désossées sans peau | boneless chicken breasts, 450 g', true],
    ['Poitrines de poulet', 'Poitrines de poulet panées, 700 g', false], ['Poulet', 'Poulet au beurre', false],
    ['Bouillon de poulet', 'Bouillon de poulet Campbell 900 ml', true], ['Poitrines de poulet', 'Bouillon de poulet Campbell 900 ml', false],
    ['Boeuf haché', 'Bœuf haché maigre | lean ground beef, 450 g', true], ['Boeuf haché', 'Burgers de boeuf haché, 1,13 kg', false],
    ['Beurre', 'Beurre Lactantia, 454 g', true], ['Beurre', 'Poulet au beurre', false], ['Beurre', 'Tartelettes au beurre 765 g', false], ['Beurre', "Beurre d'arachide Kraft 1 kg", false],
    ['Crème 35%', 'Crème 5%, 10% ou 15% Lactantia', false], ['Crème 35%', 'Crème à fouetter 35% Natrel', true], ['Crème 15%', 'Tartelettes à la crème pâtissière', false],
    ['Crème 15%', 'Fromage à la crème Philadelphia', false],
    ['Lait', 'Lait 2 % Québon 4 L', true], ['Lait', 'Lait au chocolat Québon 2 L', false], ['Lait', "Boisson aux amandes ou de soja Earth's Own", false], ['Lait', 'Lait évaporé Carnation', false],
    ['Lait 2%', 'Lait 1% Natrel 2 L', false], ['Chocolat au lait', 'Lait au chocolat Sealtest', false],
    ['Pommes', 'Pommes Cortland ou McIntosh, sac de 3 lb', true], ['Pommes', 'Les fermes Cavendish pomme terre', false], ['Pommes', 'Collation aux pommes GoGo Squeez', false],
    ['Pommes de terre', 'Pommes de terre jaunes, sac de 10 lb', true], ['Oignons', 'Carottes ou oignons jaunes, sac de 3 lb', true], ['Carottes', 'Carottes ou oignons jaunes, sac de 3 lb', true],
    ['Petites pâtes', 'Pâté St-Hubert', false], ['Petites pâtes', 'Pâtes alimentaires Catelli 900 g', true],
    ['Tomates', 'Tomates en dés Aylmer 796 ml', false], ['Tomates', 'Tomates rouges de serre', true], ['Boîtes de tomates en dés', 'Tomates en dés Aylmer 796 ml', true], ['Boîtes de tomates en dés', 'Tomates rouges de serre', false],
    ['Boîtes de saumon', 'Filets de saumon atlantique frais', false], ['Boîtes de saumon', 'Saumon rose Clover Leaf 213 g', true],
    ['Fromage râpé', 'Fromage de chèvre Compliments', false], ['Fromage râpé', 'Fromage mozzarella râpé P\'tit Québec, 907 g', true], ['Fromage cheddar', 'Fromage gouda ou suisse Monsieur Gustav', false],
    ['Poulets entiers', 'Poulet teriyaki', false], ['Poulets entiers', 'Poulet entier frais', true], ['Bacon', 'Bacon fumé Maple Leaf 375 g', true], ['Bacon', 'Poulet bardé de bacon', false],
    ['Pain tranché', 'Plateau de sandwichs moelleux, de pains farcis ou de mini-croissants', false],
    ['Feta', 'Fromage feta Tre Stelle', true], ['Fromage cheddar', 'Fromage cheddar fort Black Diamond', true], ['Saucisses', 'Saucisses de porc douces', true],
    ['Yogourt', 'Yogourt aux fraises Liberté', true], ['Thon', "Thon à l'huile Clover Leaf", true], ['Ketchup', 'Ketchup aux tomates Heinz', true],
    ['Poitrines de poulet', 'Poitrines ou cuisses de poulet', true], ['Lait 2%', 'Lait 1 % ou 2 % Natrel', true], ['Crème 35%', 'Crème 15 % ou 35 %', true],
    ['Dinde hachée', 'Dinde ou poulet haché', true], ['Huile végétale', 'Huile de canola ou végétale', true], ['Pains à hot-dog', 'Pains à hamburger ou à hot-dog', true],
    ['Jambon en dés', 'Jambon fumé Selection', true], ['Tomates en dés', 'Tomates en dés Aylmer 796 ml', true], ['Crème 35%', 'Crème à la pistache fior fiore à tartiner', false],
    ['Chocolat mi-sucré', 'Chocolat Kinder Bueno', false], ['Chocolat mi-sucré', 'Chocolat à cuisson Baker\'s mi-sucré', true]
  ]
};
const serveur = require('./serveur');
(async () => {
  const srv = await serveur();
  const b = await chromium.launch(); const page = await b.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.goto('http://localhost:8765/index.html');
  const res = await page.evaluate(async C => {
    const out = [];
    C.match.forEach(([a, t, exp]) => { const L = [{s: 'Maxi', t, p: '3,99 $'}]; const got = dealCands(a, prep(L)).length > 0; if(got !== exp) out.push(`association « ${a} » ↔ « ${t} » : attendu ${exp ? 'oui' : 'non'}`); });
    /* prix des circulaires */
    const pr = s => priceOf({p: s});
    if(pr('3,99 $') !== 3.99) out.push('priceOf 3,99 $');
    /* analyse de lignes d'ingrédients */
    const L = l => { const r = parseIngLine(l); return r ? [Math.round(r.q), r.u] : null; };
    const chk = (l, q, u) => { const r = L(l); if(!r || r[1] !== u || Math.abs(r[0] - q) > q * .05 + 1) out.push(`ingrédient « ${l} » → ${JSON.stringify(r)} (attendu ${q} ${u})`); };
    chk('1 1/2 tasse de lait', 375, 'ml'); chk('500 g (1 lb) de boeuf haché', 500, 'g'); chk('2 c. à soupe d\'huile', 30, 'ml'); chk('1 boîte de 796 ml de tomates', 796, 'ml');
    chk('1/2 à 3/4 tasse de lait', 156, 'ml'); chk('1/4 de tasse de sucre', 63, 'ml'); chk('1 boîte (28 oz/796 ml) de tomates', 796, 'ml');
    /* dates des circulaires en heure du Québec */
    if(dayOf('2026-10-21T23:59:59-04:00') !== '2026-10-21') out.push('dayOf fin de circulaire');
    if(!covers({valid_from:'2026-10-15T00:00:00-04:00', valid_to:'2026-10-21T23:59:59-04:00'}, '2026-10-21')) out.push('covers dernier jour');
    /* nombres saisis */
    [['1 200', 1200], ['150 $', 150], ['2,5', 2.5], ['-50', 0], ['abc', 0]].forEach(([v, e]) => { if(numIn(v) !== e) out.push(`numIn(${v}) = ${numIn(v)}`); });
    /* sauvegardes abîmées : complétées sans planter */
    try{ const m = mergeState({menu:{date:'x', items:'oops'}, stock:{a:{name:'Riz', q:'abc', u:'g'}}, hist:{}, custom:[{n:'X', i:[[1,'un','oeuf']], m:'pas un tableau'}], stores:'IGA', p:{budget:'-3'}});
      if(!Array.isArray(m.menu.items) || !m.menu.chk || !Array.isArray(m.hist) || !Array.isArray(m.stores) || !Array.isArray(m.custom[0].m) || m.p.budget !== 0 || Object.keys(m.stock).length) out.push('mergeState ne répare pas tout'); }
    catch(e){ out.push('mergeState plante : ' + e.message); }
    try{ mergeState(null); out.push('mergeState(null) accepté'); }catch(e){}
    /* restaurer une copie invalide ne change rien */
    const before = JSON.stringify(S); try{ restoreFrom('{"pas":"bon"}', 'x'); out.push('copie invalide acceptée'); }catch(e){} if(JSON.stringify(S) !== before) out.push('copie invalide a modifié les données');
    /* variante « -oeuf » ne retire pas le boeuf */
    const eff = effective({n:'T', i:[[450,'g','boeuf haché','viandes'],[1,'un','oeuf','produits laitiers']], v:[['Sans oeuf','-oeuf']]}, 1).map(g => g.name);
    if(!eff.includes('boeuf haché') || eff.includes('oeuf')) out.push('variante -oeuf : ' + eff.join(', '));
    /* quantités : épices pas gonflées */
    if(scaleQ(2, 'ml', 7/6) > 3) out.push('scaleQ épices ' + scaleQ(2,'ml',7/6));
    /* prix à la livre */
    const c = dealCost({p:'3,88 $', t:'Hauts de cuisse de poulet', per:'lb'}, {name:'hauts de cuisses de poulet', u:'g', buy:1000, rayon:'viandes'});
    if(Math.abs(c - 8.55) > .05) out.push('coût au poids ' + c);
    /* budget : la génération respecte une limite atteignable */
    S.p.budget = 0; S.p.n = 5; genMenu(); const t0 = listTotals(buyList().rows).cost;
    S.p.budget = Math.round(t0 * .85); const nb = budgetFit(); const t1 = listTotals(buyList().rows).cost;
    if(!(t1 < t0)) out.push(`budgetFit n'a rien baissé (${t0.toFixed(2)} → ${t1.toFixed(2)}, ${nb} changements)`);
    /* les jours du menu ne glissent pas d'un jour à l'autre */
    const days = mlist('items').map(x => x.d).join(); S.menu.start = S.menu.start || isoToday();
    if(weekDates()[0] !== (S.dates.shop || S.menu.start)) out.push('début de semaine');
    /* mise à jour des prix : prix inscrit, ajustement global, rappel mensuel */
    const b0 = baremeRaw('oeufs'); const k0 = bxKey(b0), p12 = b0[1].f[0][1];
    S.bx = {[k0]: {f:[4.99], d: isoToday()}}; if(baremeOf('oeufs')[1].f[0][1] !== 4.99) out.push('prix inscrit ignoré');
    S.pmaj = {pct: 10}; if(Math.abs(baremeOf('oeufs')[1].f[1][1] - Math.round(b0[1].f[1][1]*1.1*100)/100) > .001) out.push('ajustement % ignoré');
    if(baremeOf('oeufs')[1].f[0][1] !== 4.99) out.push('ajustement % appliqué à un prix inscrit');
    S.setup = true; S.pmaj = {d: addDays(isoToday(), -40)}; if(prixRappel() !== (gapDays(PRIX_MAJ, isoToday()) >= 30)) out.push('rappel mensuel incorrect');
    S.pmaj = {d: addDays(isoToday(), -40), snooze: addDays(isoToday(), 3)}; if(prixRappel()) out.push('rappel malgré « dans une semaine »');
    S.pmaj = {d: isoToday()}; if(prixRappel()) out.push('rappel juste après la mise à jour');
    S.bx = {}; S.pmaj = {};
    /* 2.0 : profil, horaire, préparation */
    S.profil = {membres:[{a:'adulte',ap:'normal',l:true},{a:'adulte',ap:'normal',l:true},{a:'enfant',age:14,ap:'grand',l:true},{a:'enfant',age:12,ap:'grand',l:true}], jours:{plan:4,cmd:5,ram:6,cuis:0}};
    appliquerProfil(); if(S.p.souper !== 5 || S.p.restes !== 5) out.push(`portions du profil ${S.p.souper}/${S.p.restes}`);
    if(nextDow('2026-10-15', 6) !== '2026-10-17' || nextDow('2026-10-17', 6) !== '2026-10-17' || startFrom('2026-10-17') !== '2026-10-18') out.push('jours de ramassage / cuisine');
    S.dates.shop = ''; S.menu = DEFAULT().menu; genMenu();
    if(new Date(S.menu.start+'T12:00:00').getDay() !== 0) out.push('le menu ne commence pas le dimanche : ' + S.menu.start);
    if(weekDates()[0] !== S.menu.start) out.push('semaine du menu');
    try{ prepTasks(); whyOf(mlist('items')[0]); const A = altsFor(mlist('items')[0], 'items'); if(A.length > 3) out.push('plus de 3 choix'); }catch(e){ out.push('préparation / choix : ' + e.message); }
    /* préparer la semaine suivante pendant la semaine en cours : les soupers qui restent sont gardés */
    { const td = isoToday(), dw = n => new Date(addDays(td, n)+'T12:00:00').getDay();
      S.setup = true; S.stores = []; S.cp = ''; S.hist = []; S.profil.jours = {plan:dw(0), cmd:dw(1), ram:dw(2), cuis:dw(3)};
      S.dates.shop = addDays(td, -4); S.menu = DEFAULT().menu; genMenu(); S.menu.start = addDays(td, -3); S.menu.shop = addDays(td, -4); S.dates.shop = '';
      const L = mlist('items'); L.forEach((x, k) => { x.d = addDays(S.menu.start, k); x.dfix = true; });
      const tonight = L.find(x => x.d===td).r;
      await preparerSemaine();
      if(S.menu.start !== addDays(td, 3)) out.push('nouvelle semaine : ' + S.menu.start);
      if(!(S.menu.prev||[]).some(x => x.r===tonight && x.d===td)) out.push('le souper de ce soir a disparu');
      if(!renderToday().includes(esc(tonight))) out.push('« Aujourd\'hui » ne montre pas le souper de ce soir');
      if(etape() !== 'commander') out.push('étape après préparation : ' + etape());
      if(S.hist.length !== 1) out.push('semaine précédente non archivée'); }
    S.hist = [{paid:110, est:100},{paid:120, est:100},{paid:105, est:100}]; if(Math.abs(calF() - 1.1) > .001) out.push('calibrage ' + calF()); S.hist = [];
    return out;
  }, CASES);
  await b.close(); if(srv) srv.close();
  const all = errs.map(e => 'erreur JS : ' + e).concat(res);
  console.log(all.length ? all.join('\n') + `\n${all.length} échec(s)` : 'Tous les tests unitaires passent.');
  process.exit(all.length ? 1 : 0);
})();
