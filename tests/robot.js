/* Tests du robot des prix (sans réseau) : tailles, noms, choix du produit pour une entrée du barème.
   node tests/robot.js */
const assert = require('assert');
(async () => {
  const R = await import('../robot/releve.mjs');
  const { BAREME, cle } = await import('../robot/charger.mjs');
  const idx = re => BAREME.findIndex(b => cle(b) === re);
  let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

  ok(JSON.stringify(R.taille('2 l')) === '{"q":2000,"u":"ml"}', 'taille 2 l');
  ok(R.taille('0.42 kg').q === 420, 'taille kg');
  ok(R.taille('4x90.0 g').q === 360, 'multipaquet');
  ok(R.taille('12 ea').u === 'un', 'unités');
  ok(R.variantes('Compliments Beurre salé 454 g', 'Compliments')[0] === 'beurre sale', 'marque et format retirés');
  ok(R.variantes('Natrel Natrel Lait 2 % Finement Filtré 1 L', 'Natrel')[0].startsWith('lait 2 %'), 'marque répétée');

  const lait = idx('^lait(?!ue| de coco| au chocolat)'), beurre = idx('^beurre|beurre (sale|non sale|demi)'), oeufs = idx('\\boeufs?\\b'), poit = idx('poitrines? de poulet(?! cuite)');
  ok(R.entreeDe('Lait 2 %', 'QUÉBON') === lait, 'lait reconnu');
  ok(R.entreeDe('Lot de 12 œufs de calibre gros', 'Sans Nom') === oeufs, 'oeufs (ligature)');
  ok(R.entreeDe('Boisson punch aux fruits', 'Fruité') !== oeufs, 'boisson refusée');
  ok(R.entreeDe('Beurre d\'arachide crémeux', 'Kraft') !== beurre, 'beurre d\'arachide n\'est pas du beurre');
  ok(R.entreeDe('Poitrine de poulet cuite originale', 'Olymel') !== poit, 'poulet cuit refusé');

  /* Maxi : produit régulier, spécial avec ancien prix, vendu au poids */
  const m1 = R.maxiProduit({ name: 'Lait 2 %', brand: 'QUÉBON', packageSize: '4 l', prices: { price: { value: 8.16, type: 'REGULAR', expiryDate: '9999-12-31T00:00' } }, pricingUnits: { type: 'SOLD_BY_EACH' } });
  ok(m1.reg === 8.16 && m1.cur === 8.16 && m1.t.q === 4000, 'maxi régulier');
  const m2 = R.maxiProduit({ name: 'Lait 2 %', brand: 'Natrel', packageSize: '2 l', prices: { price: { value: 4.5, type: 'SPECIAL', expiryDate: '2026-10-21T00:00' }, wasPrice: { value: 5.2 } }, pricingUnits: { type: 'SOLD_BY_EACH' } });
  ok(m2.reg === 5.2 && m2.cur === 4.5 && m2.fin === '2026-10-21', 'maxi spécial');
  const m3 = R.maxiProduit({ name: 'Poitrine de poulet désossée et sans peau', brand: '', packageSize: null, prices: { price: { value: 18.14, type: 'REGULAR' }, comparisonPrices: [{ value: 15.41, unit: 'kg', quantity: 1 }, { value: 6.99, unit: 'lb', quantity: 1 }] }, pricingUnits: { type: 'SOLD_BY_EACH_PRICED_BY_WEIGHT' } });
  ok(m3.kg && m3.kg.cur === 15.41 && m3.kg.reg === 15.41, 'maxi au poids');

  /* IGA : prix régulier + promotion « Customer Price » en cours ; les points ne comptent pas */
  const now = Date.parse('2026-10-16T12:00:00Z'), s = now / 1000 - 86400, e = now / 1000 + 6 * 86400;
  const i1 = R.igaProduit({ name: 'Compliments Beurre salé 454 g', brand: 'Compliments', price: 6.99, uom: 'EA', itemAmountValue: '454', itemAmountUnit: 'G', promotions: [
    { startDate: s, endDate: e, promotionReward: [{ rewardShortDesc: 'Points', value1Value20: [{ value_1: '25.00' }] }] },
    { startDate: s, endDate: e, promotionCondition: [{ value1Value20: [{ value_1: '1.00' }] }], promotionReward: [{ rewardShortDesc: 'Customer Price', value1Value20: [{ value_1: '6.49' }] }] }] }, now);
  ok(i1.reg === 6.99 && i1.cur === 6.49 && i1.t.q === 454, 'iga promo');
  const i2 = R.igaProduit({ name: 'Poitrine de poulet sans peau', brand: '', price: 22.19, uom: 'KG', promotions: [{ startDate: s, endDate: e, promotionReward: [{ rewardShortDesc: 'Customer Price per KG', value1Value20: [{ value_1: '20.92' }] }] }] }, now);
  ok(i2.kg && i2.kg.reg === 22.19 && i2.kg.cur === 20.92, 'iga au kilo');
  const i3 = R.igaProduit({ name: 'Yogourt', brand: '', price: 5, uom: 'EA', promotions: [{ startDate: s, endDate: e, promotionCondition: [{ value1Value20: [{ value_1: '2.00' }] }], promotionReward: [{ rewardShortDesc: 'Customer Price', value1Value20: [{ value_1: '8.00' }] }] }] }, now);
  ok(i3.cur === 5, '« 2 pour » ignoré');

  /* choix : bon format, prix régulier le plus bas, spécial noté */
  const c = R.choisir(lait, [m1, m2, R.maxiProduit({ name: 'Lait 2 %', brand: 'Sans Nom', packageSize: '4 l', prices: { price: { value: 7.9, type: 'REGULAR' } }, pricingUnits: {} })]);
  const f4 = c.f.find(x => x[0] === 4000), f2 = c.f.find(x => x[0] === 2000);
  ok(f4[1] === 7.9 && f4[2] === 0, '4 L : le moins cher, pas de spécial');
  ok(f2[1] === 5.2 && f2[2] === 4.5 && f2[4] === '2026-10-21', '2 L : régulier et spécial');
  const k = R.choisir(poit, [m3, i2]);
  ok(k.kg[0] === 15.41, 'au kilo : le moins cher');
  ok(R.choisir(oeufs, [R.maxiProduit({ name: 'Boisson punch', brand: 'Fruité', packageSize: '2 l', prices: { price: { value: 2.79, type: 'REGULAR' } }, pricingUnits: {} })]) === null, 'rien de valable : null');
  /* marque connue gardée à part quand la marque maison est moins chère */
  const mq = (marque, prix) => R.maxiProduit({ name: 'Lait 2 %', brand: marque, packageSize: '4 l', prices: { price: { value: prix, type: 'REGULAR' } }, pricingUnits: {} });
  const cm = R.choisir(lait, [mq('Sans Nom', 7.9), mq('QUÉBON', 8.16), mq('Natrel', 8.49)]);
  ok(cm.f[0][1] === 7.9 && cm.m && cm.m[0][1] === 8.16 && /Lait/.test(cm.m[0][5]), 'marque connue : ' + JSON.stringify(cm));
  ok(R.choisir(lait, [mq('QUÉBON', 8.16)]).m === 1, 'le moins cher est déjà une marque connue : 1');
  ok(!R.choisir(lait, [mq('Sans Nom', 7.9)]).m, 'aucune marque connue trouvée');
  ok(!R.marqueConnue({ marque: 'Compliments' }) && !R.marqueConnue({ marque: '' }) && R.marqueConnue({ marque: 'Heinz' }), 'marques maison');
  console.log(`robot : ${n} vérifications réussies`);
})().catch(e => { console.error(e); process.exit(1); });
