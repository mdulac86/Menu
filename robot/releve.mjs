/* Robot des prix : relève chaque semaine les prix des articles du barème chez Maxi et IGA,
   pour les magasins de robot/magasins.json, et les écrit dans prix-epiceries.json (lu par l'application).
   Utilisation : node robot/releve.mjs [--essai N]   (--essai : seulement les N premiers articles)
   Rien n'est officiel : si un site refuse, les prix précédents de ce magasin sont gardés et l'erreur est notée. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { BAREME, norm, cle, RACINE } from './charger.mjs';

const MAGASINS = JSON.parse(readFileSync(path.join(RACINE, 'robot/magasins.json'), 'utf8'));
const TERMES = JSON.parse(readFileSync(path.join(RACINE, 'robot/termes.json'), 'utf8'));
const SORTIE = path.join(RACINE, 'prix-epiceries.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const pause = ms => new Promise(r => setTimeout(r, ms));
const iso = d => { const x = new Date(d); return isNaN(x) ? '' : x.toISOString().slice(0, 10); };
const r2 = x => Math.round(x * 100) / 100;

/* ---------- tailles ---------- */
const UNI = { g: ['g', 1], kg: ['g', 1000], lb: ['g', 453.6], ml: ['ml', 1], l: ['ml', 1000], ea: ['un', 1], un: ['un', 1], unites: ['un', 1], ch: ['un', 1] };
/* « 2 l », « 454 g », « 0.42 kg », « 12 ea », « 4x90.0 g », « 6 x 355 ml » */
export function taille(s){
  s = norm(s || '').replace(',', '.');
  let m = s.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|lb|ml|l)\b/);
  if(m){ const [u, f] = UNI[m[3]]; return { q: +m[1] * +m[2] * f, u }; }
  m = s.match(/(\d+)\s*unites\b/);
  if(m) return { q: +m[1], u: 'un' };
  m = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|lb|ml|l|ea|un|ch)\b/);
  if(m){ const [u, f] = UNI[m[2]]; return { q: +m[1] * f, u }; }
  return null;
}
const SIZE_RE = /\b\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:kg|g|lb|ml|l|un|ea|ct)\b\.?/g;
/* noms à comparer au barème : sans la marque, sans les formats, puis coupé à la première virgule */
export function variantes(nom, marque){
  let n = norm(nom).replace(/\s+/g, ' ').trim();
  const b = norm(marque || '').trim();
  if(b && n.startsWith(b + ' ')) n = n.slice(b.length + 1);
  if(b && n.startsWith(b + ' ')) n = n.slice(b.length + 1);   /* IGA répète parfois la marque */
  n = n.replace(/^(lot|paquet|sac|caisse) de \d+\s+/, '').replace(SIZE_RE, ' ').replace(/\s+/g, ' ').trim();
  const court = n.split(/[,(]/)[0].trim();
  return [...new Set([n, court].filter(Boolean))];
}
/* Le nom du produit doit commencer par l'article (quelques mots descriptifs permis devant),
   et ne pas annoncer une autre forme du produit que l'article ne nomme pas (nourriture pour chien, soupe, pané…). */
const AVANT = new Set(['petit','petite','petits','petites','jeunes','jeune','gros','grosse','grosses','sac','de','d','du','des','la','le','les','lot','paquet','format','club','familial','frais','fraiche','fraiches','surgele','surgelee','surgeles','surgelees','biologique','biologiques','bio','extra','mini','desosse','desossee','desosses','desossees','pare','paree','parees','sans','peau','os','mi-maigre','maigre','extra-maigre','regulier','reguliere','calibre','fin','fins','fine','entier','entiere','entiers','tranche','tranchee','canadien','quebec','du quebec','frais du jour','naturellement','imparfait','imparfaits']);
const FORMES = ['nourriture','chien','chiens','chat','chats','bol','burrito','repas','sandwich','soupe','sauce','assaisonne','assaisonnement','marine','marinee','pane','panee','panes','panees','cuit','cuite','cuits','cuites','fume','fumee','fumees','fumes','boisson','smoothie','croustille','croustilles','chips','craquelin','craquelins','biscuit','biscuits','barre','barres','gateau','muffin','muffins','tarte','trempette','vinaigrette','seche','seches','ailes','pepites','burger','burgers','croquettes','lasagne','pate','conserve','gelee','jus','compote','puree','kit','melange','salade','simili','tartinade','glace','glacee','yogourt','creme','fromage','chocolat','bonbon','bonbons','cereales','farci','farcie','tourtiere','pizza','pogo','egg','rolls','dumplings','raviolis','gnocchi','pain','pains','nouilles','vermicelles','galettes','omelette','quiche','pouding','dessert','collation','lunch','brochettes','brochette','vapeur','teriyaki','bbq','general','tao','shawarma','souvlaki','salisbury','brownie','epice','epices'];
const FORMES_SET = new Set(FORMES);
export const entreeDe = (nom, marque) => {
  let best = -1;
  for(const v of variantes(nom, marque)){
    const i = BAREME.findIndex(b => b[0].test(v)); if(i < 0) continue;
    const re = BAREME[i][0], m = v.match(re), src = norm(re.source);
    const avant = v.slice(0, m.index).split(/[^a-z0-9-]+/).filter(Boolean);
    if(avant.some(w => !AVANT.has(w))) continue;
    if(v.split(/[^a-z-]+/).some(w => FORMES_SET.has(w) && !src.includes(w.replace(/s$/, '')))) continue;
    if(best < 0 || i < best) best = i;
  }
  return best;
};

/* ---------- choix du produit pour une entrée du barème ----------
   produits : [{nom, marque, t:{q,u}|null, cur, reg, deb, fin, kg:{cur,reg}|null}] */
/* marques maison (Maxi, IGA et quelques autres) : tout le reste avec une marque est une « marque connue » */
const MAISON_RE = /^(sans nom|no name|le choix du president|choix du president|pc|pc biologique|pc menu bleu|menu bleu|compliments|compliments organic|compliments biologique|sensations par compliments|valeur plus|prix club|irresistibles|selection|great value|our finest|equality|mastro)\b/;
export const marqueConnue = p => { const b = norm(p.marque || '').trim(); return !!b && !MAISON_RE.test(b); };
/* le produit le moins cher (souvent une marque maison), et à part le moins cher des marques connues :
   les autres épiceries n'ont pas Sans Nom ni Compliments, mais les marques connues coûtent à peu près pareil partout */
export function choisir(i, produits){
  const P = produits.filter(p => entreeDe(p.nom, p.marque) === i);
  if(!P.length) return null;
  const tout = choisir0(i, P); if(!tout) return null;
  const M = P.filter(marqueConnue), mc = M.length ? choisir0(i, M) : null;
  if(mc){
    const u = x => x.kg ? x.kg[0] ?? x.kg[1] : Math.min(...x.f.map(f => (f[1] ?? f[2]) / f[0]));
    /* m (ou mk au kilo) : la marque connue; 1 = le moins cher est déjà une marque connue */
    if(Math.abs(u(mc) - u(tout)) > u(tout) * 0.01){ if(mc.kg) tout.mk = mc.kg; else tout.m = mc.f; }
    else if(tout.kg) tout.mk = 1; else tout.m = 1;
  }
  return tout;
}
function choisir0(i, P){
  const o = BAREME[i][1];
  if(o.kg){   /* au kilo : produits vendus au poids, ou formats fixes ramenés au kilo */
    const K = P.map(p => {
      if(p.kg) return { reg: p.kg.reg, cur: p.kg.cur, deb: p.deb, fin: p.fin, nom: p.nom };
      if(p.t && p.t.u === 'g' && p.t.q >= 150) return { reg: p.reg != null ? p.reg / p.t.q * 1000 : null, cur: p.cur / p.t.q * 1000, deb: p.deb, fin: p.fin, nom: p.nom };
      return null;
    }).filter(Boolean);
    if(!K.length) return null;
    const R = K.filter(k => k.reg != null), br = R.length ? R.reduce((a, b) => b.reg < a.reg ? b : a) : null;
    const bc = K.reduce((a, b) => b.cur < a.cur ? b : a);
    const reg = br ? br.reg : null, sp = reg == null || bc.cur < reg - 0.01;
    return { kg: [reg != null ? r2(reg) : null, sp ? r2(bc.cur) : 0, sp ? bc.deb : '', sp ? bc.fin : '', (sp ? bc : br).nom.slice(0, 60)] };
  }
  const u = o.u, F = o.f || [];
  /* quantité du produit dans l'unité de l'entrée */
  const qOf = p => {
    if(u === 'un'){
      if(p.t && p.t.u === 'un') return p.t.q;
      return F.length && F[0][0] === 1 ? 1 : 0;   /* un « un » = un paquet : n'importe quel format compte pour 1 */
    }
    return p.t && p.t.u === u ? p.t.q : 0;
  };
  const C = P.map(p => ({ p, q: qOf(p) })).filter(x => x.q > 0);
  if(!C.length) return null;
  const out = [];
  const pick = (S, L) => {
    const R = L.filter(x => x.p.reg != null), br = R.length ? R.reduce((a, b) => b.p.reg < a.p.reg ? b : a) : null;
    const bc = L.reduce((a, b) => b.p.cur < a.p.cur ? b : a);
    const reg = br ? br.p.reg : null, sp = reg == null || bc.p.cur < reg - 0.01;
    out.push([S, reg != null ? r2(reg) : null, sp ? r2(bc.p.cur) : 0, sp ? bc.p.deb : '', sp ? bc.p.fin : '', (sp ? bc : br).p.nom.slice(0, 60)]);
  };
  if(u === 'un' && F.length === 1 && F[0][0] === 1){   /* « un paquet » de n'importe quel format : le produit le plus semblable au prix habituel */
    const p0 = F[0][1], d = x => Math.abs(Math.log((x.p.reg ?? x.p.cur) / p0));
    const L = C.filter(x => d(x) < Math.log(2.2)).sort((a, b) => d(a) - d(b)).slice(0, 3);
    if(L.length) pick(1, L);
    return out.length ? { f: out } : null;
  }
  F.forEach(([S]) => { const L = C.filter(x => Math.abs(x.q - S) <= S * 0.08); if(L.length) pick(S, L); });
  if(!out.length && F.length){   /* aucun format habituel : le meilleur prix unitaire d'un format voisin */
    const S0 = F[0][0], L = C.filter(x => x.q >= S0 * 0.5 && x.q <= S0 * 2);
    if(L.length){ const b = L.reduce((a, x) => (x.p.reg ?? x.p.cur) / x.q < (a.p.reg ?? a.p.cur) / a.q ? x : a); pick(b.q, [b]); }
  }
  return out.length ? { f: out } : null;
}

/* ---------- Maxi (PC Express, la même source que maxi.ca) ---------- */
const jour = () => { const d = new Date(); return String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear(); };
export function maxiProduit(p){
  const pr = p.prices || {}, cur = +(pr.price && pr.price.value), was = pr.wasPrice ? +pr.wasPrice.value : null;
  if(!(cur > 0)) return null;
  const special = pr.price.type === 'SPECIAL';
  const reg = special ? (was > 0 ? was : null) : cur;
  const fin = special && pr.price.expiryDate && !/^9999/.test(pr.price.expiryDate) ? iso(pr.price.expiryDate) : '';
  const o = { nom: String(p.name || ''), marque: String(p.brand || ''), t: taille(p.packageSize), cur, reg, deb: special ? iso(Date.now()) : '', fin, kg: null };
  /* vendu au poids : le prix « ch » est une estimation, le vrai prix est celui au kilo */
  if(/WEIGHT/.test((p.pricingUnits || {}).type || '') || (p.pricingUnits || {}).weighted){
    const k = (pr.comparisonPrices || []).find(c => /kg/.test(c.unit) && +c.quantity === 1);
    if(!k) return null;
    const kcur = +k.value; o.kg = { cur: kcur, reg: reg != null ? r2(kcur * reg / cur) : null }; o.t = null;
  }
  return o;
}
async function maxiChercher(store, term){
  const body = { pagination: { from: 0, size: 40 }, banner: 'maxi', lang: 'fr', date: jour(), storeId: store, pcId: false,
    pickupType: 'STORE', offerType: 'ALL', term, userData: { domainUserId: 'robot-prix', sessionId: 'robot-prix' } };
  for(let essai = 0; essai < 3; essai++){
    const r = await fetch('https://api.pcexpress.ca/pcx-bff/api/v1/products/search', { method: 'POST', headers: {
      'content-type': 'application/json', 'x-apikey': 'C1xujSegT5j3ap3yexJjqhOfELwGKYvz', 'Site-Banner': 'maxi', 'x-application-type': 'Web',
      'x-loblaw-tenant-id': 'ONLINE_GROCERIES', 'accept-language': 'fr', 'user-agent': UA, origin: 'https://www.maxi.ca', referer: 'https://www.maxi.ca/' },
      body: JSON.stringify(body) });
    if(r.ok){ const j = await r.json(); return (j.results || []).map(maxiProduit).filter(Boolean); }
    if(r.status === 403 || r.status === 401) throw new Error(`Maxi refuse le robot (HTTP ${r.status})`);
    await pause(2000 * (essai + 1));
  }
  throw new Error('Maxi ne répond pas');
}

/* ---------- IGA (catalogue Algolia utilisé par iga.ca) ---------- */
const ALG = { app: 'L0APUSIH50', key: '022f6cbb0292d0e78f65897fd6dabad9', index: 'dxp_product_fr' };
export function igaProduit(h, maintenant = Date.now()){
  const reg = +h.price; if(!(reg > 0)) return null;
  const parKg = h.uom === 'KG';
  let cur = reg, deb = '', fin = '';
  [].concat(h.promotions || []).forEach(pm => {
    const debut = (pm.startDate || 0) * 1000, finP = (pm.endDate || 0) * 1000;
    if(finP < maintenant || debut > maintenant + 10 * 864e5) return;   /* passée, ou trop loin */
    const qty = +(((pm.promotionCondition || [])[0] || {}).value1Value20 || [{}])[0].value_1 || 1;
    if(qty > 1) return;   /* « 2 pour… » : pas un prix unitaire */
    (pm.promotionReward || []).forEach(rw => {
      if(!/^Customer Price/.test(rw.rewardShortDesc || '')) return;
      const v = +((rw.value1Value20 || [{}])[0].value_1);
      if(v > 0 && v < cur){ cur = v; deb = iso(debut); fin = iso(finP - 1000); }
    });
  });
  const amt = h.itemAmountValue && h.itemAmountUnit ? taille(`${h.itemAmountValue} ${String(h.itemAmountUnit).toLowerCase()}`) : null;
  const o = { nom: String(h.name || ''), marque: String(h.brand || ''), t: taille(h.name) || amt, cur, reg, deb, fin, kg: null };
  if(parKg){ o.kg = { cur, reg }; o.t = null; }
  else if(o.t && o.t.u === 'un' && h.numberOfItemsInPack > 1) o.t = { q: h.numberOfItemsInPack, u: 'un' };
  return o;
}
async function igaChercher(store, terms){
  const out = [];
  /* deux recherches par article : par pertinence, et du moins cher au plus cher (les marques maison sortent parfois loin) */
  for(let k = 0; k < terms.length; k += 20){
    const lot = terms.slice(k, k + 20);
    const r = await fetch(`https://${ALG.app}-dsn.algolia.net/1/indexes/*/queries`, { method: 'POST', headers: {
      'content-type': 'application/json', 'X-Algolia-Application-Id': ALG.app, 'X-Algolia-API-Key': ALG.key, origin: 'https://www.iga.ca', referer: 'https://www.iga.ca/', 'user-agent': UA },
      body: JSON.stringify({ requests: lot.flatMap(t => [ALG.index, ALG.index + '_price_asc'].map(indexName => ({ indexName, params: new URLSearchParams({ query: t, hitsPerPage: '40', filters: `storeId:${store} AND isVisible:true` }).toString() }))) }) });
    if(!r.ok) throw new Error(`IGA refuse le robot (HTTP ${r.status})`);
    const j = await r.json();
    for(let i = 0; i < j.results.length; i += 2){
      const vus = new Set(), L = [];
      j.results[i].hits.concat((j.results[i + 1] || { hits: [] }).hits).forEach(h => { if(vus.has(h.objectID)) return; vus.add(h.objectID); const p = igaProduit(h); if(p) L.push(p); });
      out.push(L);
    }
    await pause(500);
  }
  return out;
}

/* ---------- relevé ---------- */
async function main(){
  const n = process.argv.includes('--essai') ? +process.argv[process.argv.indexOf('--essai') + 1] || 10 : BAREME.length;
  const items = BAREME.slice(0, n).map((b, i) => ({ i, k: cle(b), t: TERMES[cle(b)] })).filter(x => x.t);
  const avant = existsSync(SORTIE) ? JSON.parse(readFileSync(SORTIE, 'utf8')) : { p: {} };
  const res = { v: 1, maj: new Date().toISOString(), magasins: [], p: {} }, brut = {};
  for(const ch of Object.keys(MAGASINS)){
    for(const m of MAGASINS[ch]){
      const id = `${ch}:${m.id}`, t0 = Date.now(), P = {};
      let err = '';
      try{
        let listes;
        if(ch === 'maxi'){ listes = []; for(const it of items){ listes.push(await maxiChercher(m.id, it.t)); await pause(300); } }
        else if(ch === 'iga') listes = await igaChercher(m.id, items.map(x => x.t));
        else throw new Error('chaîne inconnue');
        items.forEach((it, j) => { const c = choisir(it.i, listes[j] || []); if(c) P[it.k] = c; });
        if(process.argv.includes('--brut')) brut[id] = Object.fromEntries(items.map((it, j) => [it.k, listes[j] || []]));
      }catch(e){ err = String(e.message || e).slice(0, 200); }
      const garde = err && avant.p && avant.p[id];
      res.p[id] = garde ? avant.p[id] : P;
      const prev = (avant.magasins || []).find(x => x.ch === ch && x.id === m.id);
      res.magasins.push({ ch, id: m.id, nom: m.nom, ok: !err, n: Object.keys(res.p[id]).length, err, d: err ? (prev && prev.d) || '' : iso(Date.now()) });
      console.log(`${m.nom} : ${err ? 'ÉCHEC, ' + err : Object.keys(P).length + ' articles'} (${Math.round((Date.now() - t0) / 1000)} s)`);
    }
  }
  writeFileSync(SORTIE, JSON.stringify(res));
  if(process.argv.includes('--brut')) writeFileSync(path.join(RACINE, 'robot/brut.json'), JSON.stringify(brut));
  console.log(`Écrit : ${SORTIE} (${Math.round(JSON.stringify(res).length / 1024)} ko)`);
  if(res.magasins.every(m => !m.ok)) process.exit(1);
}
if(import.meta.url === `file://${process.argv[1]}`) main();
