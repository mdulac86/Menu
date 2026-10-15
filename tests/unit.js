/* Tests unitaires exécutés dans la vraie page (Chromium) : association spéciaux ↔ articles, prix, analyse de texte.
   Usage : node tests/unit.js   (serveur http sur le dossier du projet, port 8765) */
const { chromium } = require('/opt/node-tools/node_modules/playwright-core');
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
    ['Chocolat mi-sucré', 'Chocolat Kinder Bueno', false], ['Chocolat mi-sucré', 'Chocolat à cuisson Baker\'s mi-sucré', true]
  ]
};
(async () => {
  const b = await chromium.launch(); const page = await b.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.goto('http://localhost:8765/index.html');
  const res = await page.evaluate(C => {
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
    return out;
  }, CASES);
  await b.close();
  const all = errs.map(e => 'erreur JS : ' + e).concat(res);
  console.log(all.length ? all.join('\n') + `\n${all.length} échec(s)` : 'Tous les tests unitaires passent.');
  process.exit(all.length ? 1 : 0);
})();
