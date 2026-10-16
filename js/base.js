/* Menu de la semaine — Utilitaires, état des données, sauvegarde et protection.
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
/* ---------- utilitaires ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/œ/g,'oe');
const keyOf = (name,u) => norm(name).replace(/\([^)]*\)/g,'').replace(/\b([a-z']{3,}?)s\b/g,'$1').replace(/\s+(rapee?|romaine)\b/g,'').replace(/\s+/g,' ').trim().replace(/^lait (2|1|3\.25|entier|ecreme|partiellement ecreme) ?%?$/,'lait')+'|'+u;
function fq(q,u){
  const dec = x => String(+x.toFixed(2)).replace('.', ',');
  if(u==='g') return q>=1000 ? dec(q/1000)+' kg' : Math.round(q)+' g';
  if(u==='ml') return q>=1000 ? dec(q/1000)+' L' : Math.round(q)+' ml';
  return '× '+String(Math.round(q*10)/10).replace('.', ',');
}
const RAYONS = ['fruits et légumes','boulangerie','viandes','poissonnerie','produits laitiers','épicerie','garde-manger','collations','boissons','surgelés'];
const GENERIC = ['fromage','pates','pain','riz','nouilles','pizza','sauce','tomate'];
const PACKS = [
  [/\boeuf/,12,'un'],[/^beurre/,454,'g'],[/^bacon/,400,'g'],[/^lait/,2000,'ml'],
  [/^creme/,500,'ml'],[/ricotta/,475,'g'],[/^sauce tomate/,680,'ml'],[/^farine/,2500,'g'],
  [/^(spaghetti|macaroni|fettuccine|rotini|penne|nouilles)/,450,'g'],[/^riz/,900,'g'],
  [/mozzarella|cheddar|fromage mexicain|fromage rape/,320,'g'],[/^parmesan/,200,'g'],[/^pommes? de terre$/,2270,'g'],
  [/^mayonnaise/,445,'ml'],[/^yogourt/,1,'un']
];
const packOf = (name,u) => { const A = art(name); if(A.pk && A.pk.u===u && A.pk.q > 0) return A.pk.q; const n = norm(name).replace(/\([^)]*\)/g,'').trim(); for(const [re,s,uu] of PACKS) if(uu===u && re.test(n)) return s; return 0; };
/* Un même ingrédient écrit en unités différentes est ramené à une seule unité, pour une seule ligne dans la liste. */
const CONV = [['pomme de terre','g',{un:200}],['tomate','un',{g:1/120}],['carotte','un',{g:1/75}],['oignon','un',{g:1/150}],
  ['chapelure','g',{ml:.45}],['chapelure panko','g',{ml:.25}],['farine','g',{ml:.53}],['fecule de mai','g',{ml:.55}],['cassonade','g',{ml:.85}],['sucre','g',{ml:.85}],
  ['sauce bbq','ml',{un:455}],["moutarde a l'ancienne",'ml',{un:250}],['cuisse de poulet desossee','g',{un:120}],['saucisse italienne','g',{un:100}],
  ['poitrine de poulet','g',{un:225}],['beurre','g',{ml:.96}],['saucisse','g',{un:100}],['patate douce','un',{g:1/300}],['haut de cuisse de poulet desosse','g',{un:120}],
  ['cotelette de porc desossee','g',{un:180}],['sauce aux prune','ml',{un:350}]];
const baseOf = name => keyOf(name,'').slice(0,-1);
function normQU(name, q, u){ const c = CONV.find(x => x[0]===baseOf(name)); return c && c[1]!==u && c[2][u] ? [q*c[2][u], c[1]] : [q, u]; }

/* ---------- état et mémoire ---------- */
const ESS_START = () => ([
    {name:'Oeufs (déjeuners)', q:12, u:'un', r:'produits laitiers', c:'Déjeuners'},
    {name:'Bacon (déjeuners)', q:400, u:'g', r:'viandes', c:'Déjeuners'},
    {name:'Céréales (boîte)', q:3, u:'un', r:'épicerie', c:'Déjeuners'},
    {name:'Gruau instantané (boîte)', q:1, u:'un', r:'épicerie', c:'Déjeuners'},
    {name:'Bagels ou muffins anglais', q:1, u:'un', r:'boulangerie', c:'Déjeuners'},
    {name:"Beurre d'arachide", q:1, u:'un', r:'épicerie', c:'Déjeuners'},
    {name:'Confiture', q:1, u:'un', r:'épicerie', c:'Déjeuners'},
    {name:'Yogourt (déjeuners)', q:8, u:'un', r:'produits laitiers', c:'Déjeuners'},
    {name:'Café', q:1, u:'un', r:'épicerie', c:'Déjeuners'},
    {name:'Pain tranché (lunchs et rôties)', q:3, u:'un', r:'boulangerie', c:'Lunchs'},
    {name:'Jambon tranché (lunchs)', q:300, u:'g', r:'viandes', c:'Lunchs'},
    {name:'Fromage tranché (paquet)', q:1, u:'un', r:'produits laitiers', c:'Lunchs'},
    {name:'Compotes de pommes (emballage)', q:1, u:'un', r:'épicerie', c:'Lunchs'},
    {name:'Boîtes de jus (lunchs)', q:1, u:'un', r:'épicerie', c:'Lunchs'},
    {name:'Pommes (sac)', q:1, u:'un', r:'fruits et légumes', c:'Fruits et légumes'},
    {name:'Bananes (régime)', q:1, u:'un', r:'fruits et légumes', c:'Fruits et légumes'},
    {name:'Clémentines ou oranges (sac)', q:1, u:'un', r:'fruits et légumes', c:'Fruits et légumes'},
    {name:'Raisins', q:1, u:'un', r:'fruits et légumes', c:'Fruits et légumes'},
    {name:'Carottes mini (collation)', q:1, u:'un', r:'fruits et légumes', c:'Fruits et légumes'},
    {name:'Concombres (collation)', q:2, u:'un', r:'fruits et légumes', c:'Fruits et légumes'},
    {name:'Croustilles (gros sac)', q:3, u:'un', r:'épicerie', c:'Collations famille'},
    {name:'Barres tendres (boîte)', q:2, u:'un', r:'épicerie', c:'Collations famille'},
    {name:'Biscuits', q:2, u:'un', r:'épicerie', c:'Collations famille'},
    {name:'Maïs soufflé', q:1, u:'un', r:'épicerie', c:'Collations famille'},
    {name:'Craquelins', q:1, u:'un', r:'épicerie', c:'Collations famille'},
    {name:'Fromage ficelle (sac)', q:1, u:'un', r:'produits laitiers', c:'Collations famille'},
    {name:'Mélange de noix (famille)', q:1, u:'un', r:'épicerie', c:'Collations famille'},
    {name:'Lait 2%', q:6000, u:'ml', r:'produits laitiers', c:'Boissons'},
    {name:'Boisson gazeuse (caisse de 12)', q:2, u:'un', r:'épicerie', c:'Boissons'},
    {name:'Jus (2 L)', q:2, u:'un', r:'épicerie', c:'Boissons'},
    {name:'Eau pétillante (caisse)', q:1, u:'un', r:'épicerie', c:'Boissons'}
]);
const DEFAULT = () => ({
  v:3, appv:'', lastExport:'', maj:0, help:false, cp:'', relay:'', dates:{plan:'', shop:''}, auto:null,
  stock:{}, hist:[], custom:[], varx:{},
  menu:{date:'', items:[], chk:{}, extra:{}, achete:false, snap:null, useup:{}},
  spec:[],
  p:{n:6, cool:4, varMode:'alt', jours:5, souper:5, restes:2, maxTm:35, nLong:1, nEnt:0, nDes:2, nDej:2, nDin:5, pDej:0, pDin:0, dinRestes:true, pp:'spec', off:[0,6], main:'', grp:'rayon', budget:0, reste:true}, sidesx:[], tmx:{}, tpx:{}, fav:{},
  maison:'sel, poivre, huile d\'olive, huile végétale, cannelle, clou de girofle, poudre de chili, ketchup, moutarde, sauce soya',
  snacks:[], ess:[],
  dis:{}, vared:{}, vardel:{}, redit:{}, stores:[], setup:false, rate:{}, art:{}, ph:{}
});
let S = DEFAULT();

const isObj = x => !!x && typeof x==='object' && !Array.isArray(x);
function mergeState(o){ if(!isObj(o)) throw new Error('données invalides'); const d = DEFAULT(); const m = Object.assign(d, o);
  /* chaque champ doit avoir le bon type, sinon on reprend la valeur par défaut (sauvegarde ancienne ou abîmée) */
  const D = DEFAULT(); Object.keys(D).forEach(k => { const v = D[k]; if(Array.isArray(v) && !Array.isArray(m[k])) m[k] = v; else if(isObj(v) && !isObj(m[k])) m[k] = v; });
  ['storesx','skip','report'].forEach(k => { if(m[k] != null && !Array.isArray(m[k])) delete m[k]; });
  ['prices','tmx','tpx','fav','dis','rate','art','ph','redit','vared','vardel','varx','bx','pmaj','pe'].forEach(k => { if(!isObj(m[k])) m[k] = {}; });
  m.menu = Object.assign(DEFAULT().menu, isObj(o.menu) ? o.menu : {});
  ['items','dej','din','ent','sou','des','sn'].forEach(k => { if(m.menu[k] != null && !Array.isArray(m.menu[k])) m.menu[k] = []; if(Array.isArray(m.menu[k])) m.menu[k] = m.menu[k].filter(x => isObj(x) && typeof x.r==='string' || (k==='sn' && isObj(x))); });
  ['chk','extra','useup','dinCook','dinNo','dsel'].forEach(k => { if(!isObj(m.menu[k])) m.menu[k] = {}; });
  m.custom = m.custom.filter(r => isObj(r) && typeof r.n==='string' && Array.isArray(r.i)).map(r => Object.assign(r, {m: Array.isArray(r.m) ? r.m.map(String) : [], i: r.i.filter(g => Array.isArray(g) && +g[0] >= 0 && typeof g[2]==='string'), e: typeof r.e==='string' ? r.e : '', s: typeof r.s==='string' ? r.s : ''}));
  m.hist = m.hist.filter(isObj).map(w => Object.assign(w, {items: Array.isArray(w.items) ? w.items : []}));
  if(m.auto && !(isObj(m.auto) && Array.isArray(m.auto.items))) m.auto = null; if((o.v||1) < 2){ m.ess = d.ess; } m.v = 4; m.p = Object.assign(DEFAULT().p, isObj(o.p) ? o.p : {});   /* nouveaux réglages : valeurs par défaut */ m.menu.useup = m.menu.useup||{}; if(m.menu.date && !m.menu.dej && !m.menu.achete) m.menu.fillNew = true; m.menu.dej = m.menu.dej||[]; m.menu.din = m.menu.din||[]; m.menu.dinCook = m.menu.dinCook||{}; m.menu.dinNo = m.menu.dinNo||{}; m.menu.dsel = m.menu.dsel||{}; m.art = m.art||{}; m.ph = m.ph||{};
  try{ Object.keys(m.ph).forEach(k => { m.ph[k] = (m.ph[k]||[]).filter(e => isFood(e.t)); if(!m.ph[k].length) delete m.ph[k]; }); if(m.auto && m.auto.items) m.auto.items = m.auto.items.filter(i => isFood(i.t)); }catch(e){} m.menu.ent = m.menu.ent||[]; m.menu.sou = m.menu.sou||[]; m.menu.des = m.menu.des||[]; if(!m.dates) m.dates = {plan:'', shop:''}; m.storesx = m.storesx||[]; m.stores = (m.stores||[]).filter(s => !['Loblaws','Food Basics','No Frills'].includes(s)); m.stores.forEach(s => { if(!STORES.includes(s) && !m.storesx.includes(s)) m.storesx.push(s); });
  m.p.budget = Math.max(0, +m.p.budget || 0);
  const st = {}; Object.values(m.stock).forEach(x => { if(!isObj(x) || typeof x.name!=='string' || !(+x.q > 0)) return; const [q,u] = normQU(x.name,+x.q,x.u); const k = keyOf(x.name,u); if(st[k]) st[k].q += q; else st[k] = Object.assign({}, x, {q,u}); }); m.stock = st;
  return m; }
/* ---------- protection des données ----------
   Les données vivent sur le téléphone, sous la clé KEY. Une mise à jour de l'application ne remplace que le code.
   1. Si les données ne peuvent pas être lues, elles sont mises de côté (RESCUE) avant tout enregistrement.
   2. Une copie est gardée avant chaque nouvelle version et une fois par jour (COPIES, 5 au maximum).
   3. Une copie peut être enregistrée dans Fichiers et restaurée. */
const APPV = self.APP_VERSION || 'dev', TEST = !!self.APP_TEST, PFX = TEST ? 'menu_test_' : 'menu_epicerie_';
const TEST_PAGE = TEST && /test\.html$/.test(location.pathname);   /* version de test publiée comme fichiers « test… » à la racine */
const KEY = PFX + 'v1', COPIES = PFX + 'copies', RESCUE = PFX + 'secours', REAL_KEY = 'menu_epicerie_v1';
let loadFailed = false, rescued = false, bkBar = true;   /* bkBar : bandeau de sauvegarde, une fois par ouverture */
function readCopies(){ try{ return JSON.parse(localStorage.getItem(COPIES) || '[]'); }catch(e){ return []; } }
function snapshot(label, raw){
  try{ const o = JSON.parse(raw); delete o.auto; raw = JSON.stringify(o); }catch(e){}
  const L = readCopies(); L.unshift({d: new Date().toISOString(), day: isoToday(), label, data: raw});
  for(let n = Math.min(L.length, 5); n >= 1; n--){ try{ localStorage.setItem(COPIES, JSON.stringify(L.slice(0, n))); return true; }catch(e){} }
  return false;
}
function loadLocal(){
  let j = null;
  try{ j = localStorage.getItem(KEY); }catch(e){}
  if(j){
    try{ S = mergeState(JSON.parse(j)); }
    catch(e){ loadFailed = true; try{ if(!localStorage.getItem(RESCUE)) localStorage.setItem(RESCUE, j); rescued = true; }catch(_){} }
    if(!loadFailed && S.appv !== APPV){ snapshot('Avant la mise à jour', j); S.appv = APPV; try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
    if(loadFailed) S.flash = "Tes données n'ont pas pu être lues par cette version. Elles sont gardées de côté, rien n'est effacé : Profil → Sauvegarde → « Essayer de les restaurer ».";
  } else S.appv = APPV;
}
/* nombre saisi : « 1 200 », « 150 $ », « 2,5 » ; jamais négatif ni NaN */
const numIn = v => Math.max(0, parseFloat(String(v ?? '').replace(/[\s\u00a0$]/g,'').replace(',','.')) || 0);
function resetCaches(){ _DO = new WeakMap(); _AR = _ND = _BL = _CAT = _PN = null; _DF = new Map(); _AS = null; _ASA = null; _ECO = new Map(); _CMP = new Map(); if(typeof peReset === 'function') peReset(); }
function save(){
  resetCaches(); S.maj = Date.now(); S.bkDirty = true;
  if(loadFailed && !rescued){ setSync("Données illisibles : rien n'est enregistré pour ne rien écraser (voir Profil)"); return; }
  const raw = JSON.stringify(S);
  const put = () => { localStorage.setItem(KEY, raw); setSync('Enregistré sur cet appareil'); };
  try{ put(); }
  catch(e){   /* stockage plein : garder seulement la copie la plus récente, puis réessayer */
    try{ localStorage.setItem(COPIES, JSON.stringify(readCopies().slice(0, 1))); put(); }
    catch(e2){ try{ localStorage.removeItem(COPIES); put(); }catch(e3){ setSync("Enregistrement impossible : mode privé ou stockage plein"); return; } }
  }
  try{ const L = readCopies(); if(!L.some(c => c.label==='Copie du jour' && c.day===isoToday())) snapshot('Copie du jour', raw); }catch(e){}
}
function setSync(t){ const e = $('#sync'); if(e) e.textContent = t; }
