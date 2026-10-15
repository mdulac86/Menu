
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
  ['prices','tmx','tpx','fav','dis','rate','art','ph','redit','vared','vardel','varx'].forEach(k => { if(!isObj(m[k])) m[k] = {}; });
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
const APPV = self.APP_VERSION || 'dev', KEY = 'menu_epicerie_v1', COPIES = 'menu_epicerie_copies', RESCUE = 'menu_epicerie_secours';
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
    if(loadFailed) S.flash = "Tes données n'ont pas pu être lues par cette version. Elles sont gardées de côté, rien n'est effacé : Réglages → Sauvegarde → « Essayer de les restaurer ».";
  } else S.appv = APPV;
}
/* nombre saisi : « 1 200 », « 150 $ », « 2,5 » ; jamais négatif ni NaN */
const numIn = v => Math.max(0, parseFloat(String(v ?? '').replace(/[\s\u00a0$]/g,'').replace(',','.')) || 0);
function resetCaches(){ _DO = new WeakMap(); _AR = _ND = _BL = _CAT = _PN = null; _DF = new Map(); _AS = null; _ASA = null; _ECO = new Map(); _CMP = new Map(); }
function save(){
  resetCaches(); S.maj = Date.now(); S.bkDirty = true;
  if(loadFailed && !rescued){ setSync("Données illisibles : rien n'est enregistré pour ne rien écraser (voir Réglages)"); return; }
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

/* ---------- recettes : variantes et ingrédients ---------- */
let _AR = null, _ND = null, _BL = null, _CAT = null, _DF = new Map();  /* caches vidés à chaque enregistrement ou rendu */
function allRecipes(){ if(!_AR) _AR = RECIPES.map(r => S.redit && S.redit[r.n] ? Object.assign({}, r, S.redit[r.n]) : r).concat(S.custom); return _AR; }
const byName = n => allRecipes().find(r => r.n === n);
function varRows(r){
  const rows = [], del = (S.vardel||{})[r.n]||[], ed = (S.vared||{})[r.n]||{};
  (r.v||[]).forEach((v,i) => { if(del.includes(i)) return; rows.push({src:'b', i, v:ed[i]||v, edited:!!ed[i]}); });
  ((S.varx||{})[r.n]||[]).forEach((v,j) => rows.push({src:'x', i:j, v}));
  return rows;
}
const vars = r => varRows(r).map(x => x.v);
const KINDS = {souper:'Soupers et dîners', dejeuner:'Déjeuners', entree:'Entrées', soupe:'Soupes et potages', dessert:'Desserts', sauce:'Sauces'};
const KIND1 = {souper:'Souper ou dîner', dejeuner:'Déjeuner', entree:'Entrée', soupe:'Soupe ou potage', dessert:'Dessert', sauce:'Sauce (complément)'};
/* Les dîners (din) utilisent les mêmes recettes que les soupers (items). */
const LISTS = ['items','din','dej','ent','sou','des'];
const ML = {items:'souper', din:'souper', dej:'dejeuner', ent:'entree', sou:'soupe', des:'dessert'};
const LOFK = {souper:'items', dejeuner:'dej', entree:'ent', soupe:'sou', dessert:'des'};
const LBL = {items:'Soupers', din:'Dîners', dej:'Déjeuners', ent:'Entrées', sou:'Soupes et potages', des:'Desserts'};
const kindOf = r => r.k || 'souper';
const PRS = {poulet:'Poulet et volaille', boeuf:'Boeuf', porc:'Porc et charcuterie', poisson:'Poissons et fruits de mer', vege:'Végétarien et oeufs', mixte:'Autres viandes'};
const STYS = {fumoir:'Fumoir', plancha:'Plancha', pub:'Pub et tailgate', pates:'Pâtes', riz:'Riz et nouilles', sandwich:'Sandwichs et burgers', mex:'Mexicain', asia:'Asiatique', mijote:'Mijoté et mijoteuse', bbq:'Grillé et BBQ', four:'Au four', poele:'À la poêle', soupe:'Soupes', salade:'Salades', bouchee:'Bouchées et trempettes', biscuit:'Biscuits et carrés', gateau:'Gâteaux, tartes et muffins', fruit:'Fruits et croustades', froid:'Poudings et desserts froids', crepe:'Crêpes', prepare:'Plats préparés', sauce:'Sauces'};
function prOf(r){
  if(r.pr) return r.pr;
  if(kindOf(r)==='dessert' || kindOf(r)==='dejeuner') return '';
  const meat = r.i.filter(g => g[3]==='viandes' || g[3]==='poissonnerie').map(g => g[2]).join(' ');
  const t = norm(r.n+' '+meat);
  if(/poulet|dinde|volaille/.test(t)) return 'poulet';
  if(/poisson|saumon|crevette|morue|aiglefin|thon|truite|petoncle|fruits de mer/.test(t)) return 'poisson';
  if(/boeuf|steak|bavette|tournedos|rosbif|veau/.test(t)) return 'boeuf';
  if(/porc|jambon|bacon|saucisse|bologne|lardon|cotes levees|pepperoni|cotelette/.test(t)) return 'porc';
  return meat ? 'mixte' : 'vege';
}
function styOf(r){
  if(r.st && r.st.length) return r.st;
  const s = new Set(), t = norm(r.n+' '+(r.s||'')), byT = {pates:'pates', riz:'riz', sandwich:'sandwich', mex:'mex'};
  if(byT[r.t]) s.add(byT[r.t]);
  if(/soya|teriyaki|tao|chinois|ramen|egg roll|wok|sesame/.test(t)) s.add('asia');
  if(/mijot|braise|chili|ragout|stroganov|coq au/.test(norm(r.n)) || /mijoteuse|1 h 30/.test(t)) s.add('mijote');
  if(/bbq|grill|brochette|steak|bavette|cotes levees|tournedos/.test(t)) s.add('bbq');
  if(/soupe/.test(t)) s.add('soupe');
  if(/salade/.test(norm(r.n))) s.add('salade');
  if(/four|plaque|gratin|lasagne|pate a la viande|pizza|°f/.test(t)) s.add('four');
  if(!s.size) s.add('poele');
  return [...s];
}
const PRS_S = {poulet:'Poulet', boeuf:'Boeuf', porc:'Porc', poisson:'Poisson', vege:'Végé', mixte:'Viande'};
const STYS_S = {fumoir:'Fumoir', plancha:'Plancha', pub:'Pub', pates:'Pâtes', riz:'Riz', sandwich:'Sandwich', mex:'Mexicain', asia:'Asiatique', mijote:'Mijoté', bbq:'Grillé', four:'Four', poele:'Poêle', soupe:'Soupe', salade:'Salade', bouchee:'Bouchée', biscuit:'Biscuits', gateau:'Gâteau', fruit:'Fruits', froid:'Froid', crepe:'Crêpes'};
function metaTags(r, souper){
  const t = [PRS_S[prOf(r)], ...styOf(r).map(s => STYS_S[s])].filter(Boolean).map(x => `<span>${esc(x)}</span>`);
  if(r.nw) t.push('<span class="new">Nouveau</span>');
  if(S.fav[r.n]) t.push('<span class="fav">Favori</span>');
  if(souper && isLong(r)) t.push('<span class="long">Fin de semaine</span>');
  if(r.pp) t.push('<span class="pp">Prêt à servir</span>');
  if(r.sp) t.push(`<span>${kindOf(r)==='dejeuner' ? 'Déjeuner de semaine' : 'Simple'}</span>`);
  if(r.pp && dealsOf(r).length) t.push('<span class="spec">En spécial</span>');
  const rt = S.rate[r.n]; if(rt && rt.up > rt.down) t.push('<span class="liked">Aimé</span>'); else if(rt && rt.down > rt.up) t.push('<span class="long">Peu aimé</span>');
  return `<div class="meta">${t.join('')}</div>`;
}
const tagHtml = s => `<span class="tag"><span class="nm">${esc(s.t)}</span>${s.p ? `<b>${esc(s.p)}</b>` : ''}<small>${esc(s.s)}</small></span>`;
const tagLine = r => [kindOf(r)==='souper' ? '' : KIND1[kindOf(r)], PRS[prOf(r)]||'', ...styOf(r).map(s => STYS[s]||'')].filter(Boolean).join(' · ');
const mlist = l => (S.menu[l] = S.menu[l] || []);
const nOf = l => l==='items' ? S.p.n : l==='ent' ? (S.p.nEnt||0) : l==='sou' ? (S.p.nSou||0) : l==='dej' ? (S.p.nDej||0) : l==='din' ? dinNeed().length : (S.p.nDes||0);
const allItems = () => LISTS.flatMap(l => S.menu[l]||[]);
const histItems = w => (w.items||[]).concat(w.din||[], w.dej||[], w.ent||[], w.sou||[], w.des||[]);
function deltaItems(delta){
  const out = {add:[], rem:[]};
  String(delta||'').split(';').map(s => s.trim()).filter(Boolean).forEach(tok => {
    const m = tok.match(/^@([fv])=(\S+)$/); if(m){ out[m[1]] = m[2]; return; }
    if(tok[0]==='+'){ const x = tok.match(/^\+\s*([\d.,]+)\s+(g|ml|un)\s+(.*?)(?:\|(.*))?$/); if(x) out.add.push({q:parseFloat(x[1].replace(',','.')), u:x[2], name:x[3].trim(), ray:(x[4]||'').trim()}); }
    else if(tok[0]==='-'){ const x = tok.match(/^-\s*([\d.,]+)\s+(g|ml|un)\s+(.*)$/); out.rem.push(x ? {q:parseFloat(x[1].replace(',','.')), u:x[2], name:x[3].trim()} : {name:tok.slice(1).trim()}); }
  });
  return out;
}
const unitTxt = (q,u) => `${+q} ${u==='un' ? '' : u+' '}`;
function varDetail(v){
  const d = deltaItems(v[1]), L = [];
  const sn = id => id==='aucun' ? 'aucun' : ((sideById(id)||{}).n || id);
  d.add.forEach(a => L.push('Ajoute : '+qt(a.q,a.u)+' '+a.name));
  d.rem.forEach(x => L.push('Retire : '+(x.q ? qt(x.q,x.u)+' ' : '')+x.name));
  if(d.f!==undefined) L.push('Féculent : '+sn(d.f));
  if(d.v!==undefined) L.push('Légume ou salade : '+sn(d.v));
  const desc = vdesc(v[0]);
  return `<div class="var">${desc?`<p style="margin:0">${esc(desc)}</p>`:''}${L.length?`<ul class="small" style="margin:4px 0 0;padding-left:18px">${L.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${v[2]?`<p class="small" style="margin:4px 0 0"><b>Préparation :</b> ${esc(v[2])}</p>`:''}${!desc && !L.length && !v[2] ? '<p class="small" style="margin:0">Aucun changement d\'ingrédient.</p>' : ''}</div>`;
}
function resetV(n){ allItems().forEach(x => { if(x.r===n){ x.v = 0; x.ovr = {}; } }); }
/* après un changement de versions : chaque plat garde la même version (retrouvée par son contenu), sinon revient à la base */
function remapV(n, before, a){
  const r = byName(n), after = r ? varRows(r).map(x => x.v) : [];
  allItems().concat((S.occ && S.occ.items) || []).forEach(x => { if(x.r!==n || !x.v) return; const old = before[x.v-1], j = after.indexOf(old);
    if(j >= 0) x.v = j+1; else if(a==='vsave' && after[x.v-1]) {} else { x.v = 0; x.ovr = {}; } });
}
function addToMenu(r){ const l = LOFK[kindOf(r)]; const L = mlist(l); L.push(l==='items' ? mkItem(r, usedSides(L), pickVar(r)) : {r:r.n, v:pickVar(r)}); if(l==='items'){ linkFollow(L[L.length-1]); assignDays(false); } }
const vname = t => { const i = t.indexOf(':'); const n = (i>0 ? t.slice(0,i) : t).trim(); return n.length>34 ? n.slice(0,32)+'…' : n; };
const vdesc = t => { const i = t.indexOf(':'); return i>0 ? t.slice(i+1).trim() : ''; };
function effective(r, idx){
  const map = new Map();
  const add = (q,u,name,rayon) => { const k = keyOf(name,u); const o = map.get(k); if(o) o.q += q; else map.set(k,{q,u,name,rayon:rayon||'épicerie'}); };
  r.i.forEach(([q,u,name,rayon]) => add(q,u,name,rayon));
  const d = idx>0 && vars(r)[idx-1] ? vars(r)[idx-1][1] : '';
  d.split(';').map(x => x.trim()).filter(Boolean).forEach(tok => {
    if(tok[0]==='+'){
      const m = tok.match(/^\+\s*([\d.,]+)\s+(g|ml|un)\s+(.*?)(?:\|(.*))?$/);
      if(m) add(parseFloat(m[1].replace(',','.')), m[2], m[3].trim(), (m[4]||'').trim());
    } else if(tok[0]==='-'){
      const m = tok.match(/^-\s*([\d.,]+)\s+(g|ml|un)\s+(.*)$/);
      if(m){ const k = keyOf(m[3].trim(), m[2]); const o = map.get(k); if(o){ o.q -= parseFloat(m[1].replace(',','.')); if(o.q<=0) map.delete(k); } }
      else { const nm = tok.slice(1).trim(), w = norm(nm), b = baseOf(nm), ex = [...map].filter(([k,o]) => baseOf(o.name)===b);
        const re = new RegExp('(^|[^a-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])');
        (ex.length ? ex : [...map].filter(([k,o]) => re.test(norm(o.name)))).forEach(([k]) => map.delete(k)); }
    }
  });
  return [...map.entries()].map(([k,o]) => ({k,...o}));
}


/* ---------- accompagnements, portions, stock ---------- */
const TYPES = {viande:'Viande',pates:'Pâtes',riz:'Riz et nouilles',sandwich:'Sandwich et burger',mex:'Mexicain',complet:'Repas complet'};
const ALLS = () => SIDES.concat(S.sidesx||[], stockSides());
const sideById = id => id ? ALLS().find(s => s.id===id) : null;
const sidesOf = sl => ALLS().filter(s => s.sl===sl);
const compat = (s, r) => s.ty.includes('all') || s.ty.includes(r.t||'viande');
const totalPortions = () => (S.p.souper||4) + (S.p.restes||0);
const pDej = () => S.p.pDej || S.p.souper || 4;
const pDin = () => S.p.pDin || (S.p.restes > 0 ? S.p.restes : S.p.souper) || 2;
const portionsOf = it => it.pt || (it.din ? pDin() : totalPortions());
/* portions habituelles d'un plat selon sa section du menu */
const ptDef = (it, l) => l==='items' ? totalPortions() : (l==='din' || it.din) ? pDin() : l==='dej' ? pDej() : 6;
function variantSides(r, idx){
  const o = {}; const d = idx>0 && vars(r)[idx-1] ? vars(r)[idx-1][1] : '';
  d.split(';').forEach(tok => { const m = tok.trim().match(/^@([fv])=(\S+)$/); if(m) o[m[1]] = m[2]==='aucun' ? '' : m[2]; });
  return o;
}
const recentSides = () => new Set(S.hist.slice(-2).flatMap(w => w.items.flatMap(x => [x.sf,x.sv])).filter(Boolean));
const usedSides = items => new Set(items.flatMap(x => [x.sf,x.sv]).filter(Boolean));
const sigWords = name => norm(name).replace(/\([^)]*\)/g,'').split(/[^a-z]+/).filter(w => w.length>=4 && !['fromage','sauce','pate','pates','pain','tranche','portion','individuel','boite','paquet','emballage','hache','moulu','rape','frais','fume','cuit','gros','grand','mini'].includes(w)).map(w => w.replace(/s$/,''));
/* « Fromage cheddar » couvre « cheddar râpé », « Poulet » couvre « poitrines de poulet », mais « Pommes » ne couvre pas « pommes de terre ». */
const CUTS = ['poitrine','cuisse','haut','filet','pilon','laniere','cube','tranche','desosse','desossee','surgele','surgelee','fort','doux','moyen','maigre','extra','entier','entiere','petit','petite','bebe','jeune','fraiche','frai'];
function sameFood(a, b){
  if(!a.length || !b.length) return false;
  const extra = (x, y) => x.filter(w => !y.includes(w));
  return (a.every(w => b.includes(w)) && extra(b,a).every(w => CUTS.includes(w))) || (b.every(w => a.includes(w)) && extra(a,b).every(w => CUTS.includes(w)));
}
function stockKey(n){
  if(S.stock[n.k]) return n.k;
  const nw = sigWords(n.name); if(!nw.length) return null;
  for(const [k,o] of Object.entries(S.stock)){ if(o.u===n.u && sameFood(sigWords(o.name), nw)) return k; }
  return null;
}
function stockSideBonus(s){ return s.i.some(([q,u,n]) => { if(isMaison(n)) return false; const u2 = normQU(n,q,u)[1]; return !!stockKey({k:keyOf(n,u2),name:n,u:u2}); }) ? .5 : 0; }
/* Genre de féculent. Un plat qui contient déjà des pâtes, du riz ou des patates ne reçoit que du pain;
   un plat dans du pain (burger, tacos) peut avoir des frites ou du riz, mais pas un autre pain. */
const STARCH = [['pates',/spaghetti|\bpates\b|macaroni|penne|fusilli|rotini|linguine|fettuccine|tortellini|ravioli|lasagne|gnocchi|nouilles|vermicelle|orzo|ramen|udon|coquilles/],
  ['riz',/\briz\b|risotto|quinoa|couscous/],['patate',/pommes? de terre|patates?|frites|grelots|pilees|rissolees|wedges|pelures|dauphinois/],
  ['pain',/\bpains?\b|baguette|naan|\bpitas?\b|tortillas?|brioche|ciabatta|kaiser/]];
const HEAVY = ['pates','riz','patate'];
const starchOf = txt => { const t = norm(txt).replace(/pates? a pizza|coquilles a tacos/g, 'pain').replace(/pates? (au poulet|a la viande)|pates? a tarte|pate de /g, ' ').replace(/pate chinois|hachis|cottage pie/g, 'patate'); return STARCH.filter(([,re]) => re.test(t)).map(([k]) => k); };
const _MST = new WeakMap(), _SST = new WeakMap();
function mainStarch(r){ let s = _MST.get(r); if(!s){ s = new Set(); (r.i||[]).forEach(g => starchOf(g[2]).forEach(k => s.add(k))); _MST.set(r, s); } return s; }
function sideStarch(sd){ let k = _SST.get(sd); if(!k){ k = [...new Set(starchOf(sd.n).concat((sd.i||[]).flatMap(g => starchOf(g[2]))))]; _SST.set(sd, k); } return k; }
function clash(sd, r){
  if(!sd || !r) return false; const m = mainStarch(r), k = sideStarch(sd); if(!k.length || !m.size) return false;
  if(k.some(x => m.has(x))) return true;
  return HEAVY.some(x => m.has(x)) && k.some(x => HEAVY.includes(x));
}
function chooseSide(r, slot, used){
  const def = (slot==='f' ? r.sf : r.sv) ?? '';
  if(def==='') return '';
  if(r.fx && r.fx[slot] && sideById(def)) return def;   /* accompagnement choisi pour toujours */
  const rec = recentSides();
  const c = sidesOf(slot).filter(s => !(S.sdis||{})[s.id] && (s.id===def || (compat(s,r) && !(slot==='f' && clash(s,r))))); if(!c.length) return '';
  let best='', bs=-9;
  c.forEach(s => { const sc = Math.random() + (s.id===def?.5:0) + (s.id.startsWith('st:')?.9:(s.id[0]==='x'?.3:0)) - (used.has(s.id)?1.5:0) - (rec.has(s.id)?.6:0) + stockSideBonus(s); if(sc>bs){ bs=sc; best=s.id; } });
  return best;
}
function mkItem(r, used, v){
  const ov = variantSides(r, v);
  const it = {r:r.n, v, ovr:{f:'f' in ov, v:'v' in ov}, fm:1, vm:1};
  it.sf = 'f' in ov ? ov.f : chooseSide(r,'f',used);
  it.sv = 'v' in ov ? ov.v : chooseSide(r,'v',used);
  return it;
}
function scaleQ(q,u,f){
  if(Math.abs(f-1)<1e-9) return q;
  const x = q*f;
  if(u==='un') return x>=3 ? Math.ceil(x-1e-9) : Math.ceil(x*2-1e-9)/2;
  return x>=100 ? Math.round(x/10)*10 : x>=20 ? Math.round(x/5)*5 : Math.max(.5, Math.round(x*2)/2);
}
function fullIngs(it, all){
  const r = byName(it.r); if(!r) return [];
  const f = kindOf(r)==='souper' ? portionsOf(it)/6 : kindOf(r)==='dejeuner' ? (it.pt || pDej())/6 : (it.pt ? it.pt/6 : 1), ex = it.ex||[];
  const map = new Map();
  const put = (g, fac) => { if(fac<=0) return; const q = scaleQ(g.q,g.u,fac); const o = map.get(g.k); if(o) o.q += q; else map.set(g.k,{k:g.k,q,u:g.u,name:g.name,rayon:g.rayon}); };
  const prim = r.ur ? primOf(it) : null;
  effective(r,it.v).forEach(g => { if(prim && urMatch(r.ur, g.name)){ if(all) map.set('r'+g.k,{k:g.k,q:scaleQ(g.q,g.u,f),u:g.u,name:g.name,rayon:g.rayon,rest:prim.r}); return; } const out = ex.includes(g.k); if(out && !all) return; if(out){ map.set('x'+g.k,{k:g.k,q:scaleQ(g.q,g.u,f),u:g.u,name:g.name,rayon:g.rayon,x:true}); return; } put(g,f); });
  if(r.rs && follOf(it)) r.rs.x.forEach(([q,u,n,ra]) => put({k:keyOf(n,u),q,u,name:n,rayon:ra}, 1));
  const sr = it.sc ? byName(it.sc) : null;   /* sauce ajoutée au plat */
  if(sr) sr.i.forEach(([q,u,n,ra]) => { const g = {k:keyOf(n,u),q,u,name:n,rayon:ra}; const out = ex.includes(g.k); if(out && !all) return; if(out){ map.set('x'+g.k,{...g,q:scaleQ(q,u,f),x:true}); return; } put(g, f); });
  [['sf','fm'],['sv','vm']].forEach(([key,mk]) => { const s = sideById(it[key]); if(!s) return;
    s.i.forEach(([q,u,n,ra]) => { const g = {k:keyOf(n,u),q,u,name:n,rayon:ra}; const out = ex.includes(g.k); if(out && !all) return; if(out){ map.set('x'+g.k,{...g,q:scaleQ(q,u,f),x:true}); return; } put(g, f*(it[mk]??1)); }); });
  return [...map.values()];
}
/* clé de stock d'un ingrédient, avec la même conversion d'unités que la liste (4 pommes de terre ↔ 800 g) */
const skOf = g => { const [q,u] = normQU(g.name, g.q, g.u); return stockKey({k:keyOf(g.name,u), name:g.name, u, q}); };
function stockOf(it){ const out = []; fullIngs(it).forEach(g => { if(isMaison(g.name)) return; const sk = skOf(g); if(sk){ const nm = S.stock[sk].name; if(!out.includes(nm)) out.push(nm); } }); return out.slice(0,3); }
function aUtiliser(){
  if(!Object.keys(S.stock).length) return [];
  const used = new Set(); needs().forEach(n => { if(n.src.includes('Restes à manger')) return; const sk = stockKey(n); if(sk) used.add(sk); });
  return Object.entries(S.stock).filter(([k,o]) => !isMaison(o.name) && !used.has(k)).map(([k,o]) => ({k,o,eat:!!S.menu.useup[k]}));
}
function ideesPour(o){
  const w = sigWords(o.name); if(!w.length) return [];
  const rec = recentSet(), inM = new Set(allItems().map(x => x.r));
  return allRecipes().filter(r => !S.dis[r.n] && !rec.has(r.n) && !inM.has(r.n) && effective(r,0).some(g => g.u===o.u && sigWords(g.name).some(x => w.includes(x)))).slice(0,3);
}
function sidesLabel(r){ const nm = id => id==='auto' ? 'varié' : (sideById(id)||{}).n; return `${TYPES[r.t||'viande']||''} · Par défaut : ${[nm(r.sf||''),nm(r.sv||'')].filter(Boolean).join(' + ') || 'aucun accompagnement'} (change chaque semaine)`; }
const qt = (q,u) => fq(q,u).replace('× ','');
function sideBlock(it,i,l){
  l = l || 'items'; const r = byName(it.r), dis = '';
  const QO = [[0,'Aucun'],[0.5,'Moins'],[1,'Normal'],[1.5,'Plus'],[2,'Double']];
  const col = slot => { const key = slot==='f'?'sf':'sv', mk = slot==='f'?'fm':'vm', all = sidesOf(slot);
    const fit = s => compat(s,r) && !(slot==='f' && clash(s,r)), ok = all.filter(fit), other = all.filter(s => !fit(s)); const cur = it[key]||'';
    const op = s => `<option value="${esc(s.id)}" ${cur===s.id?'selected':''}>${esc(s.n)}</option>`;
    return `<div><label class="f">${slot==='f'?'Féculent':'Légume / salade'}<select data-a="sidesel" data-ml="${l}" data-i="${i}" data-s="${slot}" ${dis}><option value="">Aucun</option><optgroup label="Recommandés">${ok.map(op).join('')}</optgroup><optgroup label="Autres">${other.map(op).join('')}</optgroup></select></label>
      <label class="f">Quantité<select data-a="sideq" data-ml="${l}" data-i="${i}" data-s="${slot}" ${dis}>${QO.map(([v,n]) => `<option value="${v}" ${(it[mk]??1)===v?'selected':''}>${n}</option>`).join('')}</select></label></div>`; };
  return `<div class="grid2">${col('f')}${col('v')}</div>`;
}
function renderUtiliser(){
  const L = aUtiliser(); if(!L.length) return '';
  return `<div class="card"><h3>À utiliser cette semaine</h3><p class="small">Ce qui est à la maison et que le menu n'utilise pas encore. « Je le mange » le compte comme collation ou lunch; il sera retiré de la maison à la fin de la semaine.</p>`
   + L.map(x => { const id = ideesPour(x.o); return `<div class="item" style="flex-wrap:wrap"><span class="t"><b>${esc(x.o.name)}</b><small>${fq(x.o.q,x.o.u)} en stock</small></span><button class="btn s ${x.eat?'p':''}" data-a="eat" data-k="${esc(x.k)}">${x.eat?'Au menu ✓':'Je le mange'}</button>${id.length?`<div class="chips" style="width:100%">${id.map(r => `<button class="btn s" data-a="addrec" data-r="${esc(r.n)}">+ ${esc(r.n)}</button>`).join('')}</div>`:''}</div>`; }).join('') + `</div>`;
}

/* ---------- mode Cuisiner : ingrédients et étapes à cocher ---------- */
let cook = null, wl = null;
const CK = 'menu_epicerie_cuisine';   /* cases cochées, à part des données (pas de sauvegarde pour ça) */
const ckRead = () => { try{ return JSON.parse(localStorage.getItem(CK) || '{}') || {}; }catch(e){ return {}; } };
const ckWrite = o => { try{ const lim = Date.now() - 8*864e5; Object.keys(o).forEach(k => { if(!o[k] || (o[k].ts||0) < lim) delete o[k]; }); localStorage.setItem(CK, JSON.stringify(o)); }catch(e){} };
async function wakeOn(){ try{ if(cook && !wl && navigator.wakeLock){ wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } }catch(e){ wl = null; } }
function wakeOff(){ try{ if(wl) wl.release(); }catch(e){} wl = null; }
/* une étape par phrase; « 400°F 40 min. » ou « 2,5 » ne coupent pas */
function splitSteps(s){
  const parts = String(s||'').replace(/\s+/g, ' ').replace(/(^|[.!?]\s+)\d{1,2}[.)]\s+/g, '$1').trim().split(/([.!?])\s+/), out = []; let cur = '';
  for(let i = 0; i < parts.length; i += 2){ cur += parts[i] + (parts[i+1] || ''); const nx = parts[i+2];
    if(nx === undefined || /^[A-ZÀ-ÖØ-Þ0-9«(]/.test(nx)){ if(cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ' '; }
  return out;
}
function cookItem(){
  if(!cook) return null;
  if(cook.r){ const r = byName(cook.r); if(!r) return null; const kd = kindOf(r);
    return {r, it:{r:r.n, v:cook.v||0, pt: kd==='souper' ? totalPortions() : kd==='dejeuner' ? pDej() : 0, sf:r.sf && r.sf!=='auto' ? r.sf : '', sv:r.sv && r.sv!=='auto' ? r.sv : ''}, l:''}; }
  const it = mlist(cook.l)[cook.i]; if(!it) return null; const r = byName(it.r); return r ? {r, it, l:cook.l} : null;
}
function cookHtml(){
  const c = cookItem(); if(!c) return '';
  const {r, it, l} = c, kd = kindOf(r), vs = vars(r), cur = it.v>0 ? vs[it.v-1] : null;
  const f = kd==='souper' ? portionsOf(it)/6 : kd==='dejeuner' ? (it.pt || pDej())/6 : (it.pt ? it.pt/6 : 1);
  const np = kd==='souper' ? portionsOf(it) : kd==='dejeuner' ? (it.pt || pDej()) : (it.pt || 0);
  const qx = (q, u) => u==='un' ? String(Math.round(q*10)/10).replace('.', ',') : fq(q, u);
  const prim = l==='items' && r.ur ? primOf(it) : null, fo = l==='items' ? follOf(it) : null, ex = it.ex || [];
  const groups = [], steps = [];
  const main = effective(r, it.v||0).map(g => ({n:g.name, q:qx(scaleQ(g.q,g.u,f), g.u), note: prim && urMatch(r.ur, g.name) ? 'restes de '+prim.r : ex.includes(g.k) ? 'retiré de la liste d\'épicerie' : ''}));
  if(r.rs && fo) r.rs.x.forEach(([q,u,n]) => main.push({n, q:qx(q,u), note:'en plus, pour '+fo.r}));
  groups.push({t: kd==='souper' ? 'Le plat' : '', rows:main});
  const sr = it.sc ? byName(it.sc) : null;
  if(sr) groups.push({t:'Sauce : '+sr.n, rows:sr.i.map(([q,u,n]) => ({n, q:qx(scaleQ(q,u,f), u), note:''}))});
  const sides = [['sf','fm'],['sv','vm']].map(([k,m]) => ({s:sideById(it[k]), m:it[m]??1})).filter(x => x.s && x.m > 0);
  sides.forEach(({s, m}) => groups.push({t:'Avec : '+s.n, rows:s.i.map(([q,u,n]) => ({n, q:qx(scaleQ(q,u,f*m), u), note:''}))}));
  splitSteps(r.s).forEach(t => steps.push({t}));
  if(cur && cur[2]) splitSteps(cur[2]).forEach(t => steps.push({t, g:'Pour la version '+vname(cur[0]).toLowerCase()}));
  if(sr && sr.s) splitSteps(sr.s).forEach(t => steps.push({t, g:'Sauce : '+sr.n}));
  sides.filter(x => x.s.s).forEach(({s}) => splitSteps(s.s).forEach(t => steps.push({t, g:'Avec : '+s.n})));
  const sans = sides.filter(x => !x.s.s); if(sans.length) steps.push({t:'Préparer '+sans.map(x => lowFirst(x.s.n)).join(' et ')+'.', g:'Accompagnements'});
  const st = (ckRead()[cook.key] || {}).c || {};
  let ni = 0; const total = groups.reduce((t,g) => t + g.rows.length, 0) + steps.length, done = Object.keys(st).filter(k => st[k] && (/^s(\d+)$/.test(k) ? +k.slice(1) < steps.length : /^i(\d+)$/.test(k) && +k.slice(1) < total - steps.length)).length;
  const ingH = groups.map(g => `${g.t ? `<p class="ck-g">${esc(g.t)}</p>` : ''}<div class="ck-list">${g.rows.map(x => { const id = 'i'+(ni++);
    return `<label class="ck-row"><input type="checkbox" data-ck="${id}" ${st[id]?'checked':''}><span class="ck-tx"><span>${esc(x.n)}${x.note ? `<em>${esc(x.note)}</em>` : ''}</span><span class="ck-q">${esc(x.q)}</span></span></label>`; }).join('')}</div>`).join('');
  let lastG = null, sn = 0;
  const stepH = steps.map((x, j) => { const id = 's'+j, head = x.g !== lastG && x.g ? `</div><p class="ck-g">${esc(x.g)}</p><div class="ck-list">` : ''; lastG = x.g; sn++;
    return `${head}<label class="ck-row ck-step"><input type="checkbox" data-ck="${id}" ${st[id]?'checked':''}><span class="ck-num">${sn}</span><span class="ck-tx">${esc(x.t)}</span></label>`; }).join('');
  const when = it.d ? (l==='dej' ? 'Déjeuner' : l==='din' ? 'Dîner' : 'Souper')+', '+dayLbl(it.d).toLowerCase() : KIND1[kd] || '';
  const mt = l==='items' ? mjTxt(it, r) : '';
  return `<div class="ck-in"><div class="ck-top"><button class="btn s" data-a="ck_close">Fermer</button><span class="ck-prog" id="ck_prog">${done} sur ${total} cochés</span></div>
    <div class="ck-bar" aria-hidden="true"><i id="ck_bar" style="width:${total ? Math.round(done/total*100) : 0}%"></i></div>
    <p class="td-k">${esc(when)}</p><h2 class="ck-t">${esc(r.n)}</h2>
    <p class="small">${np ? `Pour ${np} portions` : 'Environ 6 à 8 portions'} · ${esc(tmTxt(r))}${cur ? ' · version '+esc(vname(cur[0]).toLowerCase()) : ''}</p>
    ${mt ? `<p class="rest">${esc(mt)}</p>` : ''}${prim ? `<p class="rest">Avec les restes de ${esc(prim.r)}.</p>` : ''}${fo ? `<p class="rest">Garde le surplus pour ${esc(fo.r)}.</p>` : ''}
    ${navigator.wakeLock ? '<p class="small">L\'écran reste allumé pendant que tu cuisines.</p>' : ''}
    <h3 class="ck-h">Ingrédients</h3>${ingH}
    <h3 class="ck-h">Étapes</h3><div class="ck-list">${stepH}</div>
    <div class="acts"><button class="btn s" data-a="ck_reset">Tout décocher</button><button class="btn s p" data-a="ck_close">Terminé</button></div></div>`;
}
function renderCook(){
  const el = $('#cook'); if(!el) return;
  const html = cook ? cookHtml() : '';
  if(!html){ if(cook){ cook = null; wakeOff(); } el.hidden = true; el.innerHTML = ''; document.documentElement.classList.remove('ckopen'); return; }
  el.innerHTML = html; el.hidden = false; document.documentElement.classList.add('ckopen');
}
function openCook(o){
  if(o.r) cook = {r:o.r, v:o.v||0, key:'r|'+o.r};
  else { const it = mlist(o.l)[o.i]; if(!it) return; cook = {l:o.l, i:o.i, key:o.l+'|'+it.r+'|'+(it.d||S.menu.date||'')}; }
  renderCook(); const el = $('#cook'); if(el) el.scrollTop = 0;
  wakeOn();
}
function closeCook(){ cook = null; wakeOff(); renderCook(); }
function ckProgress(){
  const el = $('#cook'); if(!el) return; const all = el.querySelectorAll('input[data-ck]'), done = el.querySelectorAll('input[data-ck]:checked').length;
  const pg = $('#ck_prog'), br = $('#ck_bar'); if(pg) pg.textContent = `${done} sur ${all.length} cochés`; if(br) br.style.width = (all.length ? Math.round(done/all.length*100) : 0)+'%';
}
document.addEventListener('visibilitychange', () => { if(cook && document.visibilityState==='visible') wakeOn(); });
document.addEventListener('keydown', e => { if(cook && e.key==='Escape') closeCook(); });

/* ---------- textes à envoyer ---------- */
function ligneSouper(it,i){
  const r = byName(it.r); if(!r) return null;
  const vs = vars(r), v = it.v>0 && vs[it.v-1] ? vname(vs[it.v-1][0]) : '';
  const ac = avecTxt(it);
  return {r, v, ac, titre:`${i+1}. ${r.n}${v ? ' - '+v : ''}`};
}
function texteMenu(){
  const m = S.menu; if(!m.date) return '';
  const L = [`MENU DE LA SEMAINE - ${m.date}`];
  LISTS.forEach(l => {
    if(l==='din'){ const P = dinPlan().filter(p => p.it || p.rest); if(!P.length) return; L.push('', 'DÎNERS');
      P.forEach(p => { if(p.rest){ L.push(`${dayLbl(p.d)} : restes de ${p.rest.r}`); return; }
        const x = ligneSouper(p.it, 0); if(!x) return;
        L.push((p.d ? dayLbl(p.d)+' : ' : '')+x.titre.replace(/^\d+\. /,''));
        if(x.ac) L.push('   Avec : '+x.ac);
        L.push(`   ${portionsOf(p.it)} portions`); });
      return; }
    const X = mlist(l).slice(); if(!X.length) return; L.push('', LBL[l].toUpperCase());
    if(l==='items' || l==='dej') X.sort((a,b) => (a.d||'9').localeCompare(b.d||'9'));
    X.forEach((it,i) => { const x = ligneSouper(it,i); if(!x) return;
      L.push(it.d ? `${dayLbl(it.d)} : ${x.titre.replace(/^\d+\. /,'')}` : x.titre);
      if(x.ac) L.push('   Avec : '+x.ac);
      if(it.sc) L.push('   Sauce : '+it.sc);
      if(l==='items') L.push(`   ${portionsOf(it)} portions`);
      if(l==='dej') L.push(`   ${it.pt || pDej()} portions`);
      const p = primOf(it); if(p && x.r.ur) L.push(`   Avec les restes de : ${p.r}`);
      const fo = follOf(it); if(fo && x.r.rs) L.push(`   Garder des restes pour : ${fo.r}`);
      itemDeals(it, x.r).slice(0,2).forEach(d => L.push(`   Spécial : ${specTxt(d.hit)}`)); }); });
  return L.join('\n');
}
function texteRecette(it, i, withCode){
  const x = ligneSouper(it, i||0); if(!x) return ''; const r = x.r, kd = kindOf(r);
  const np = kd==='souper' ? portionsOf(it) : kd==='dejeuner' ? (it.pt || pDej()) : (it.pt || 0);
  const L = [x.titre.replace(/^\d+\. /,''), `${kd==='souper' && !it.din && !it.pt ? `Pour ${np} portions (souper + restes du dîner)` : np ? `Pour ${np} portions` : 'Environ 6 à 8 portions'} · ${tmTxt(r)}`];
  const cur = it.v>0 ? vars(r)[it.v-1] : null;
  if(cur) L.push('Version : '+vname(cur[0])+(vdesc(cur[0]) ? ' - '+vdesc(cur[0]) : ''));
  if(x.ac) L.push('Accompagnements : '+x.ac);
  L.push('', 'INGRÉDIENTS');
  fullIngs(it).sort((a,b) => a.name.localeCompare(b.name,'fr')).forEach(g => L.push(`- ${g.name} : ${qt(g.q,g.u)}`));
  if(r.s) L.push('', 'PRÉPARATION', r.s);
  if(cur && cur[2]) L.push('', 'POUR CETTE VERSION', cur[2]);
  if(withCode) L.push('', "Pour l'ajouter à ta banque (Recettes, Importer une recette copiée), copie tout ce message :", recCode(r));
  return L.join('\n');
}
function texteDetail(){
  const m = S.menu; if(!m.date) return '';
  const parts = []; LISTS.forEach(l => mlist(l).forEach((it,i) => { const t = texteRecette(it,i); if(t) parts.push(t); }));
  return `MENU DÉTAILLÉ - semaine du ${m.date}\n\n` + parts.join('\n\n------------------------------\n\n');
}
function texteListe(){
  const m = S.menu; if(!m.date) return '';
  const {rows, verify} = buyList();
  const L = [`LISTE D'ÉPICERIE - ${m.date}`];
  groupsOf(rows).forEach(g => { L.push('', g.title.toUpperCase()); g.sub.forEach(s => { if(s.ray) L.push('- '+cap(s.ray)); s.rows.forEach(r => { const d = dealFor(r.name); L.push(`[ ] ${cap(r.name)} : ${qt(r.buy,r.u)}${d ? '   (spécial '+d.s+(d.p ? ' '+d.p : '')+')' : ''}`); }); }); });
  if(verify.length) L.push('', 'À VÉRIFIER À LA MAISON', verify.map(v => v.name).sort().join(', '));
  return L.join('\n');
}

/* ---------- importer une recette copiée ---------- */
function recCode(r){
  const o = {n:r.n, k:kindOf(r), pr:r.pr||'', st:r.st||[], t:r.t||'', tm:tmOf(r), sf:r.sf||'', sv:r.sv||'', m:r.m||[], i:r.i, s:r.s||'', v:vars(r)};
  if(tpOf(r) < tmOf(r)) o.tp = tpOf(r); if(mjOf(r)) o.mj = mjOf(r);
  if(r.pp) o.pp = true; if(r.ur) o.ur = r.ur; if(r.rs) o.rs = r.rs;
  let bin = ''; new TextEncoder().encode(JSON.stringify(o)).forEach(x => { bin += String.fromCharCode(x); });
  return 'MDS1.'+btoa(bin)+'.FIN';
}
function decodeCode(c){ const bin = atob(c.replace(/\s+/g,'')); return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0)))); }
function uniqueName(n){ let x = n, k = 2; while(allRecipes().some(r => norm(r.n)===norm(x))) x = `${n} (${k++})`; return x; }
function parseRecetteTexte(txt){
  const lines = txt.split(/\r?\n/).map(l => l.trim());
  const title = lines.find(l => l && !/^(pour |environ |version|accompagnements|ingr)/i.test(l)); if(!title) return null;
  const pm = txt.match(/Pour (\d+) portions/), fac = pm ? 6/(+pm[1]) : 1;
  const i0 = lines.findIndex(l => /^INGR[ÉE]DIENTS$/i.test(l)); if(i0<0) return null;
  const ing = [];
  for(let k = i0+1; k < lines.length && lines[k]; k++){
    const m = lines[k].match(/^-\s*(.+?)\s*:\s*([\d.,]+)\s*(kg|g|ml|L)?$/); if(!m) continue;
    let q = parseFloat(m[2].replace(',','.')), u = m[3] || 'un'; [q,u] = toBase(q,u);
    q = u==='un' ? Math.max(1, Math.round(q*fac*2)/2) : Math.round(q*fac);
    ing.push([q, u, m[1], (catFind(m[1])||{}).ray || guessRayon(m[1])]);
  }
  if(!ing.length) return null;
  const p0 = lines.findIndex(l => /^PR[ÉE]PARATION$/i.test(l));
  const s = p0>=0 ? lines.slice(p0+1).filter(Boolean).filter(l => !/^POUR CETTE VERSION|^Pour l'ajouter/.test(l))[0] || '' : '';
  return {n:title.replace(/\s+-\s+.*$/,''), k:'souper', m:[], i:ing, s, v:[], tm:30, sf:'auto', sv:'auto', t:'viande'};
}

/* ---------- lire une recette copiée d'un site Internet ---------- */
const FRACS = {'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875,'⅕':.2};
/* Mesures : [expression, facteur, unité de base]. Les cuillères et tasses canadiennes : 15 ml, 5 ml, 250 ml. */
const MESURES = [
  [/^(?:c\.?\s*(?:à|a)\s*(?:soupe|table|s\.?)|cuill[eè]res?\s*(?:à|a)\s*(?:soupe|table)|cuil\.?\s*(?:à|a)\s*soupe|c\.\s*s\.|c-à-s|cas|tbsp|tbs|tb)(?![a-zà-ÿ])\.?/i, 15, 'ml'],
  [/^(?:c\.?\s*(?:à|a)\s*(?:th[ée]|caf[ée]|t\.?)|cuill[eè]res?\s*(?:à|a)\s*(?:th[ée]|caf[ée])|cuil\.?\s*(?:à|a)\s*th[ée]|c\.\s*t\.|c-à-t|cat|tsp)(?![a-zà-ÿ])\.?/i, 5, 'ml'],
  [/^(?:tasses?|cups?)(?![a-zà-ÿ])/i, 250, 'ml'],
  [/^(?:millilitres?|ml)(?![a-zà-ÿ])\.?/i, 1, 'ml'],
  [/^(?:centilitres?|cl)(?![a-zà-ÿ])/i, 10, 'ml'],
  [/^(?:décilitres?|dl)(?![a-zà-ÿ])/i, 100, 'ml'],
  [/^(?:litres?|l)(?![a-zà-ÿ])\.?/i, 1000, 'ml'],
  [/^(?:kilogrammes?|kilos?|kg)(?![a-zà-ÿ])\.?/i, 1000, 'g'],
  [/^(?:grammes?|gr|g)(?![a-zà-ÿ])\.?/i, 1, 'g'],
  [/^(?:livres?|lbs?)(?![a-zà-ÿ])\.?/i, 454, 'g'],
  [/^(?:onces?|oz)(?![a-zà-ÿ])\.?/i, 28, 'g'],
  [/^(?:pinc[ée]es?|soupçons?|traits?)(?![a-zà-ÿ])/i, 1, 'ml']
];
/* Contenants et pièces : on garde le mot dans le nom et on compte à l'unité, sauf si leur format est donné (boîte de 796 ml). */
const PIECES = /^(gousses?|bo[iî]tes?|conserves?|paquets?|sacs?|sachets?|enveloppes?|tranches?|bottes?|branches?|feuilles?|brins?|tiges?|morceaux?|poign[ée]es?|pots?|bouteilles?|rouleaux?|abaisses?|contenants?|barquettes?|casseaux?|noix|noisettes?|cubes?|filets?|pi[eè]ces?|t[eê]tes?|grappes?|bouquets?)(?![a-zà-ÿ])/i;
const PREPS = ['finement','grossièrement','grossierement','au goût','au gout','facultatif','facultative','environ','bien tassée','bien tassé','tassée','tassé','légèrement battu','légèrement battus','à la température ambiante','à température ambiante','pour la cuisson','pour badigeonner','pour servir','pour garnir','en garniture','(facultatif)'];
const ADJS = /^(petite?s?|grosses?|gros|grande?s?|moyenne?s?|large|beaux?|belles?|bonne?s?|environ)\s+/i;
const STAPLES = /^(sel|poivre|sel et poivre|eau|eau froide|eau chaude|eau bouillante|glaçons?|huile pour la friture)$/;
const SYN = [[/\bsauce soja\b/,'sauce soya'],[/\bpatates?\b(?! douces?)/,'pommes de terre'],[/\b[ée]chalotes? vertes?\b/,'oignons verts'],[/\bcr[èe]me (\d\d) ?%/,'crème $1%']];
/* Mots qu'on peut laisser tomber pour retrouver l'aliment connu (« boeuf haché maigre » → « boeuf haché »). */
const DESC = new Set(['hache','hachee','haches','hachees','emince','emincee','eminces','emincees','tranche','tranchee','tranches','tranchees','rape','rapee','rapes','rapees','pele','pelee','peles','pelees','maigre','mi-maigre','extra-maigre','frais','fraiche','fraiches','russet','yukon','gold','moyen','moyenne','moyens','moyennes','gros','grosse','grosses','petit','petite','petits','petites','coupe','coupee','coupes','coupees','finement','desosse','desossee','desosses','desossees','sans','peau','os','pare','paree','nature','ordinaire','espagnol','espagnols','italien','italienne','tout','usage','tout-usage','non','sale','salee','doux','douce','et']);

function readNum(s){
  const m = s.match(/^(\d+)\s+(\d+)\/(\d+)|^(\d+)\s*([½¼¾⅓⅔⅛⅜⅝⅞⅕])|^(\d+)\/(\d+)|^([½¼¾⅓⅔⅛⅜⅝⅞⅕])|^(\d+(?:[.,]\d+)?)/);
  if(!m) return null;
  let v = m[1] ? +m[1] + m[2]/m[3] : m[4] ? +m[4] + FRACS[m[5]] : m[6] ? m[6]/m[7] : m[8] ? FRACS[m[8]] : parseFloat(m[9].replace(',','.'));
  let rest = s.slice(m[0].length);
  const r = rest.match(/^\s*(?:à|a|-|–|ou)\s*(?=[\d½¼¾⅓⅔⅛⅜⅝⅞⅕])/);   /* 2 à 3, 1/2 à 3/4, 1 à 1 1/2 : on garde la moyenne */
  if(r){ const w = readNum(rest.slice(r[0].length)); if(w){ v = (v + w.v)/2; rest = w.rest; } }
  return {v, rest};
}
function readMeasure(s){
  s = s.trim().replace(/^d(?:e\s+|['’]\s*)(?=(?:tasses?|cups?|c\.|cuil|cuill|lb|livres?|kg|g\b|ml|l\b|oz|onces?))/i, '');
  for(const [re, f, u] of MESURES){ const m = s.match(re); if(m) return {f, u, rest:s.slice(m[0].length)}; }
  return null;
}
/* « 2 tasses (500 ml) » : on préfère la mesure métrique entre parenthèses. */
function metricIn(par){
  const n = readNum(par.trim()); if(!n) return null;
  const me = readMeasure(n.rest); if(!me || (me.u==='ml' && me.f===15) || me.f===5 || me.f===250 || me.f===454 || me.f===28) return null;
  return {q:n.v*me.f, u:me.u};
}
function cleanName(raw){
  let n = ' '+raw.replace(/\s+/g,' ').trim()+' ';
  n = n.replace(/\([^)]*\)/g,' ');
  const cut = n.indexOf(','); if(cut>0) n = n.slice(0, cut);
  n = n.replace(/\s+ou\s+.*$/i, ' ');                               /* « beurre ou margarine » : le premier choix */
  PREPS.forEach(w => { n = n.replace(new RegExp('\\s'+w.replace(/[()]/g,'\\$&')+'(?=\\s|$)','gi'), ' '); });
  n = n.trim().replace(/^(de |d'|d’|du |des |de la |de l'|de l’)/i, '').replace(ADJS, '').replace(/^(de |d'|d’|du |des )/i, '').trim();
  let nn = norm(n); SYN.forEach(([re, to]) => { if(re.test(nn)) { n = n.replace(new RegExp(re.source.replace(/\\b/g,''),'i'), to); nn = norm(n); } });
  return n.replace(/\s+/g,' ').replace(/[.;:]+$/,'').trim();
}
/* Relier au catalogue : on raccourcit le nom jusqu'à trouver un aliment connu (« oignon haché » → « oignon »). */
function matchCatalog(name){
  const w = name.split(' ');
  for(let k = w.length; k >= 1; k--){ const c = catFind(w.slice(0,k).join(' ')); if(c) return {c, k, full: k===w.length}; }
  return null;
}
function parseIngLine(line){
  let s = line.replace(/^[\s\-–•·*▢□☐◻✓✔○●]+/, '').replace(/\u00a0/g,' ').trim();
  if(!s) return null;
  let q = 0, u = 'un', piece = '', can = false;
  const n = readNum(s);
  if(n){
    s = n.rest.trim();
    const me = readMeasure(s);
    if(me){ q = n.v*me.f; u = me.u; s = me.rest.trim();
      const par = s.match(/^\(([^)]*)\)/); if(par){ const mi = metricIn(par[1]); if(mi && me.f!==1){ q = mi.q; u = mi.u; } s = s.slice(par[0].length).trim(); } }
    else {
      const par = s.match(/^\(([^)]*)\)/);                          /* « 1 (796 ml) boîte » ou « 2 (env. 400 g) poitrines » */
      const pm = s.match(PIECES);
      if(pm){ piece = pm[0]; s = s.slice(pm[0].length).trim(); }
      const pMetric = pm && /bo[iî]te|conserve|paquet|sac|sachet|pot|bouteille|contenant|barquette|casseau|enveloppe/i.test(pm[0]) ? (() => { const p2 = s.match(/^(?:de\s+)?\(([^)]*)\)/); const mm = p2 && p2[1].match(/(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\b/i); if(mm){ s = s.slice(p2[0].length).trim(); return mm; } return null; })() : null;
      const sz = pMetric || s.match(/^(?:de\s+)?\(?\s*(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|oz|lb)\b\.?\s*\)?/i)
             || (par ? par[1].match(/(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|lb)\b/i) : null);
      if(sz && piece && /bo[iî]te|conserve|paquet|sac|sachet|pot|bouteille|contenant|barquette|casseau|enveloppe/i.test(piece)){
        const me2 = readMeasure(sz[2]); const size = parseFloat(String(sz[1]).replace(',','.'))*me2.f;
        q = n.v*size; u = me2.u; can = /bo[iî]te|conserve/i.test(piece); piece = ''; if(!pMetric && s.match(/^(?:de\s+)?\(?\s*\d/)) s = s.slice(sz[0].length).trim();
      } else { q = n.v; u = 'un'; if(par && !pm) s = s.slice(par[0].length).trim();
        const wt = (s+' '+(par ? par[0] : '')).match(/(?:\bde\s+|\(\s*(?:env(?:iron|\.)?\s*)?)(\d+(?:[.,]\d+)?)\s*(kg|g|lb|ml|l)\b\.?(\s*(?:chacune?s?|ch\.|par morceau))?(?:\s*(?:au total|en tout))?\s*\)?/i);
        if(wt && !piece){ const me3 = readMeasure(wt[2]); const size = parseFloat(wt[1].replace(',','.'))*me3.f; q = wt[3] ? n.v*size : (/^\s*de\b/i.test(wt[0]) ? n.v*size : size); u = me3.u; s = s.replace(wt[0].trim(), ' ').replace(/\(\s*(au total|en tout)?\s*\)/i,' ').replace(/\s+(au total|en tout)\b/i,' ').trim(); } }
    }
  }
  s = s.replace(/^\([^)]*\)\s*/, '');
  const name = cleanName((piece ? piece+' ' : '') + s);
  if(!name || name.length < 2) return null;
  return {q, u, name, noq: !n, can};
}
const name0 = n => n.split(' ');
const H_ING = /^(ingr[ée]dients?|ce qu'il (vous )?faut|liste d'?ingr[ée]dients)\s*:?$/i;
const H_STEP = /^(pr[ée]paration|[ée]tapes?|instructions?|m[ée]thode|mode de pr[ée]paration|directions|marche à suivre)\s*:?$/i;
const H_END = /^(notes?|conseils?|astuces?|valeurs? nutritives?|nutrition|par portion|informations? nutritionnelles?|à propos|commentaires?|vous aimerez aussi|imprimer|partager)\b/i;
const T_LINE = /^(temps|pr[ée]paration|cuisson|temps total|total|marinade|repos|r[ée]frig[ée]ration|congélation|portions?|rendement|donne|pour)\b/i;
function minutesOf(s){ const n = norm(s); let t = 0; const hh = n.match(/(\d+)\s*h(?:eures?)?\s*(\d+)?/); if(hh) t += (+hh[1])*60 + (+(hh[2]||0)); const mm = !hh && n.match(/(\d+)\s*min/); if(mm) t += +mm[1]; return t; }
function parseWebRecipe(txt){
  const lines = txt.replace(/\r/g,'').split('\n').map(l => l.replace(/\u00a0/g,' ').trim());
  const isIngLine = l => /^[\-–•·*▢□☐◻]?\s*(\d|[½¼¾⅓⅔⅛])/.test(l) && !/^\d+\s*(min|minutes?|h|heures?|portions?|personnes|parts)\b/i.test(l);
  let i0 = lines.findIndex(l => H_ING.test(l));
  /* sans titre « Ingrédients » : le premier bloc de lignes qui commencent par une quantité */
  let i1 = -1;
  if(i0 < 0){ const k = lines.findIndex(isIngLine); if(k < 0) return null; i0 = k-1; let z = k; while(z < lines.length && (isIngLine(lines[z]) || !lines[z])) z++; i1 = z; }
  else i1 = lines.findIndex((l,k) => k>i0 && (H_STEP.test(l) || /^(1[.)]\s|[ée]tape 1\b)/i.test(l)));
  if(i1 < 0) i1 = lines.length;
  /* temps et portions : n'importe où avant les étapes */
  let prep = 0, cook = 0, total = 0, portions = 0;
  for(let k = 0; k < i1; k++){
    const l = lines[k], nx = lines[k+1]||''; const both = T_LINE.test(l) && !/\d/.test(l) ? l+' '+nx : l;
    const n = norm(both).replace(/^temps (de |d')?(?=preparation|cuisson)/,'');
    /* une ligne peut contenir plusieurs temps : « Préparation 20 min Cuisson 1 h » */
    n.split(/(?=\b(?:preparation|cuisson|(?:temps )?total|portions?|rendement)\b)/).forEach(sg => { sg = sg.trim();
      if(/^preparation\b/.test(sg) && /\d/.test(sg)) prep = prep || minutesOf(sg.replace(/^preparation\s*:?/,''));
      else if(/^cuisson\b/.test(sg) && /\d/.test(sg)) cook = cook || minutesOf(sg.replace(/^cuisson\s*:?/,''));
      else if(/^(temps )?total\b/.test(sg) && /\d/.test(sg)) total = total || minutesOf(sg); });
    const pm = n.match(/^(?:portions?|rendement|donne|pour)\s*:?\s*(\d+)/) || n.match(/^(\d+)\s*(?:portions?|personnes|parts|services)\b/);
    if(pm && !portions) portions = +pm[1];
  }
  /* titre : première ligne qui n'est ni un titre de section, ni un temps, ni une quantité */
  const title = lines.slice(0, Math.max(i0,1)).find(l => l && l.length>2 && l.length<90 && !T_LINE.test(l) && !H_ING.test(l) && !/^\d/.test(l) && !/^(recette|accueil|menu|imprimer|partager|enregistrer|par |photo|\d+ (avis|commentaires?))/i.test(l))
    || lines.find(l => l && !isIngLine(l)) || 'Recette importée';
  const ing = [], unsure = [];
  for(let k = i0+1; k < i1; k++){
    const l = lines[k]; if(!l) continue;
    if(H_END.test(l)) break;
    if(T_LINE.test(l) && !isIngLine(l)) continue;
    const g = parseIngLine(l); if(!g) continue;
    const nn = norm(g.name);
    if(/^(portions?|personnes|parts|min|minutes|h|heures)\b/.test(nn) || STAPLES.test(nn)) continue;
    if(g.noq){
      if(STAPLES.test(nn) || /^(sel|poivre)\b/.test(nn) && nn.split(' ').length<=4) continue;
      if(/:$/.test(l) || (l.split(' ').length<=3 && !matchCatalog(g.name) && !/\bau go[uû]t\b/i.test(l))) continue;   /* sous-titre : « Sauce », « Garniture : » */
    }
    ing.push(g);
  }
  if(!ing.length) return null;
  /* étapes */
  const steps = [];
  for(let k = i1 < lines.length && H_STEP.test(lines[i1]) ? i1+1 : i1; k < lines.length; k++){
    const l = lines[k]; if(!l) continue; if(H_END.test(l)) break;
    if(T_LINE.test(l) && /\d/.test(l) && l.length < 40) continue;
    steps.push(l.replace(/^(?:[ée]tape\s*)?\d+\s*[.)\-–:]?\s+/i,'').trim());
  }
  const tn = norm(title);
  const k = /gateau|tarte|biscuit|muffin|carre|brownie|pouding|croustade|mousse|sucre a la creme|beigne|cupcake|bagatelle|tiramisu|cheesecake|gateau au fromage|pain aux bananes|crumble|clafoutis|fudge|sorbet|creme glacee|tartelette|galette/.test(tn) ? 'dessert'
    : /^(soupe|potage|creme de|veloute|chaudree|bouillon)\b/.test(tn) ? 'soupe'
    : /^(sauce|vinaigrette|pesto|mayonnaise|tzatziki|marinade|coulis)\b/.test(tn) ? 'sauce'
    : /trempette|bouchee|bruschetta|rouleaux de printemps|ailes de poulet|nachos|tapenade|hummus|houmous|verrine|canape|salade (verte|cesar)/.test(tn) ? 'entree' : 'souper';
  const fac = k==='souper' && portions > 0 ? 6/portions : 1;
  const rows = ing.map(g => {
    let q = g.noq ? 1 : g.q*fac, u = g.u;
    const hit = matchCatalog(g.name), c = hit && hit.c;
    const useCat = c && (hit.full || name0(g.name).slice(hit.k).every(x => DESC.has(norm(x).replace(/[^a-z-]/g,''))));
    let name = useCat ? c.n : cap(g.name);
    if(c && u==='un' && c.u!=='un' && g.noq){ u = c.u; q = c.u==='g' ? 100 : 15; }
    q = u==='un' ? Math.max(.5, Math.round(q*2)/2) : q < 20 ? Math.round(q*10)/10 : Math.round(q);
    if(g.noq) unsure.push(name);
    const [qq,uu] = niceUnit(q,u);
    return {n:name, q:String(+(+qq).toFixed(2)), u:uu, ray: c ? c.ray : g.can ? 'épicerie' : guessRayon(g.name)};
  });
  const tm = total || (prep + cook) || 30;
  return {n:title.replace(/\s*[-–|].*$/, '').trim(), k, tm, tp:prep && cook ? prep : 0, portions, fac, rows, s:steps.join(' ').replace(/\s+/g,' ').trim(), unsure};
}
const TM_OPTS = [10,15,20,25,30,35,40,45,50,60,75,90,120,150];
function webToDraft(w){
  const tm = TM_L.find(v => v >= w.tm) || Math.max(10, Math.round(+w.tm || 30));
  drafts.new = {n:w.n, k:w.k, pr:'', st:[], t:'viande', tm:String(tm), tp:String(w.tp ? Math.min(TP_L.find(v => v >= w.tp) || 90, tm) : tm), mj:/mijoteuse|slow cooker/i.test(w.s||''), sf:'auto', sv:'auto', fam:false, m:'', s:w.s, rows:w.rows.length ? w.rows : emptyRows(4)};
}

/* Mots de circulaire par défaut : la viande ou le poisson de la recette, sinon le premier mot du nom. */
function autoMots(ing, name){
  const mots = [];
  ing.filter(x => x[3]==='viandes' || x[3]==='poissonnerie').forEach(x => { const nm = plain(x[2]).toLowerCase(), kw = ['poulet','boeuf','porc','dinde','jambon','saumon','crevette','saucisse','bacon','veau','agneau','tilapia','morue','aiglefin','thon'].find(w => norm(nm).includes(w)); [nm, kw].forEach(w => { if(w && !mots.includes(w)) mots.push(w); }); });
  return mots.length ? mots : [String(name).split(/[ ,]+/)[0].toLowerCase()];
}
function importRecipes(txt){
  const found = []; const re = /MDS1\.([A-Za-z0-9+\/=\s]+?)\.FIN/g; let m;
  while((m = re.exec(txt))){ try{ const o = decodeCode(m[1]); if(o && o.n && Array.isArray(o.i)) found.push(o); }catch(e){} }
  if(!found.length){ const o = parseRecetteTexte(txt); if(o) found.push(o); }
  const names = []; let skipped = 0;
  found.forEach(o => {
    /* recette partagée : on ne garde que des champs du bon type (un code abîmé ne doit pas casser l'onglet Recettes) */
    if(!o || typeof o.n!=='string' || !o.n.trim()) return;
    o.n = o.n.trim().slice(0, 120);
    o.i = (Array.isArray(o.i) ? o.i : []).filter(g => Array.isArray(g) && isFinite(+g[0]) && +g[0] >= 0 && ['g','ml','un'].includes(g[1]) && typeof g[2]==='string' && g[2].trim())
      .map(g => [+g[0], g[1], g[2].trim().slice(0, 120), RAYONS.includes(g[3]) ? g[3] : guessRayon(g[2])]);
    if(!o.i.length) return;
    o.m = Array.isArray(o.m) ? o.m.filter(x => typeof x==='string') : [];
    o.s = typeof o.s==='string' ? o.s : ''; o.e = typeof o.e==='string' ? o.e : '';
    o.v = Array.isArray(o.v) ? o.v.filter(v => Array.isArray(v) && typeof v[0]==='string').map(v => [v[0], typeof v[1]==='string' ? v[1] : '', typeof v[2]==='string' ? v[2] : undefined].filter(x => x !== undefined)) : [];
    ['tm','tp','mj'].forEach(k => { if(o[k] != null && !isFinite(+o[k])) delete o[k]; });
    if(o.k && !KINDS[o.k]) delete o.k;
    const same = allRecipes().find(r => norm(r.n)===norm(o.n));
    if(same && JSON.stringify(same.i)===JSON.stringify(o.i)){ skipped++; return; }
    o.n = same ? uniqueName(o.n) : o.n; Object.assign(o, {c:true, nw:true, e:o.e||'', v:o.v||[]}); if(!o.m || !o.m.length) o.m = autoMots(o.i, o.n);
    S.custom.push(o); _AR = null; names.push(o.n);
  });
  return {added:names.length, names, skipped};
}

const CATS = [['','Sans catégorie'],['f','Féculent'],['v','Légume ou salade'],['p','Protéine'],['c','Collation'],['o','Autre']];
function stockSides(){
  const TYK = {pates:['viande'], riz:['viande','riz','mex'], patate:['viande','sandwich','complet'], pain:['viande','pates','complet']};
  const tyOf = o => { if(o.cat!=='f') return ['all']; const k = starchOf(o.name); return k.length ? [...new Set(k.flatMap(x => TYK[x]))] : ['viande','complet']; };
  return Object.entries(S.stock).filter(([k,o]) => o.cat==='f' || o.cat==='v').map(([k,o]) => ({id:'st:'+k, n:o.name+' (à la maison)', sl:o.cat, ty:tyOf(o), i:[[Math.max(.5, Math.round(o.q/Math.max(.5,totalPortions()/6)*10)/10), o.u, o.name, o.rayon||'épicerie']]}));
}
const tmOf = r => (S.tmx||{})[r.n] ?? r.tm ?? 30;
/* préparation : le temps où il faut être aux fourneaux. Le four sans surveillance et la mijoteuse ne comptent pas. */
const tpOf = r => Math.min(tmOf(r), (S.tpx||{})[r.n] ?? r.tp ?? tmOf(r));
const mjOf = r => +(r && r.mj) || 0;   /* 1 : recette à la mijoteuse; 2 : braisé qui peut y aller */
const MAX_FOUR = 90;                    /* cuisson sans surveillance acceptable un soir de semaine */
const fmtMin = m => { m = Math.round(+m||0); return m < 60 ? m+'\u00a0min' : Math.floor(m/60)+'\u00a0h'+(m%60 ? '\u00a0'+String(m%60).padStart(2,'0') : ''); };
const weekOk = r => tpOf(r) <= (S.p.maxTm||35) && (tmOf(r) <= MAX_FOUR || mjOf(r) > 0);
const isLong = r => !weekOk(r);
const tmTxt = r => { const a = tpOf(r), t = tmOf(r); return t > a + 5 ? `${fmtMin(a)} de préparation, ${fmtMin(t)} au total${mjOf(r)===1 ? ' (mijoteuse)' : ''}` : fmtMin(t); };
const tmShort = r => fmtMin(tpOf(r));
const tmList = r => tmOf(r) > tpOf(r) + 5 ? `${fmtMin(tpOf(r))} + cuisson` : fmtMin(tmOf(r));
const TP_L = [5,10,15,20,25,30,35,40,45,60,75,90], TM_L = [10,15,20,25,30,35,40,45,50,55,60,70,75,90,120,150,180,240,300,360,480,600,720];
const optMin = (list, cur) => list.concat([+cur]).filter((v,j,a) => v && a.indexOf(v)===j).sort((a,b) => a-b).map(v => `<option value="${v}" ${+cur===v?'selected':''}>${fmtMin(v)}</option>`).join('');
function mjTxt(it, r){
  const mj = mjOf(r); if(!mj || !it.d) return '';
  const wk = !isOff(it.d);
  if(mj===1) return wk ? 'Mijoteuse : prépare les ingrédients la veille au soir, pars la mijoteuse le matin.' : 'Mijoteuse : pars-la le matin.';
  if(tmOf(r) <= MAX_FOUR) return '';
  return wk ? `Soir de semaine : prépare-le la veille, puis 8 h à faible intensité à la mijoteuse pendant la journée (au lieu de ${fmtMin(tmOf(r))} au four ou sur le feu).` : 'Aussi possible à la mijoteuse : 8 h à faible intensité.';
}

/* ---------- variété : familles de plats ---------- */
const FAMS = [['fajitas',/fajita/],['tacos',/\btacos?\b/],['quesadillas',/quesadilla/],['burritos',/burrito|enchilada/],['nachos',/nachos/],
  ['pizza',/pizza|calzone/],['burger',/burger|sloppy/],['rotisserie',/poulets? (bbq|roti|entier)|tourne-broche|crapaudine/],['jambon',/^jambon|epaule de jambon/],['hotdog',/hot-?dogs?|michigan|bratwurst|guedille/],['saucisses',/\bsaucisses\b/],['sandwich',/sous-marin|sandwich|panini|croque-|club|cheesesteak|hot chicken/],['teriyaki',/teriyaki/],
  ['wrap',/wrap|\bpitas?\b|souvlaki|shawarma|gyro/],['poutine',/poutine/],['spaghetti',/spaghetti/],['lasagne',/lasagne/],['mac',/mac (n|and) cheese|macaroni/],
  ['chili',/chili/],['pate',/pate chinois|cottage pie|hachis/],['tourte',/tourtiere|pate a la viande|pates? au poulet (maison|surgele)|^pate au poulet/],['saute',/saute|\bwok\b|general tao|chow mein|chop suey|riz frit/],['curry',/curry|tikka|poulet au beurre/],['cotelettes',/cotelettes/],
  ['nouilles',/ramen|nouilles|pad thai|lo mein/],['soupe',/\bsoupes?\b|chaudree|potage/],['bol',/\bbols?\b|poke/],['effiloche',/effiloch/],['ailes',/\bailes\b/],
  ['cotes',/cotes levees/],['brochettes',/brochette/],['boulettes',/boulette/],['painviande',/pains? de viande/],['oeufs',/quiche|omelette|frittata/],
  ['pane',/croquette|\bpanes?\b|parmesan/],['steak',/steak|bavette|contre-filet|cote de boeuf|picanha|surlonge|filet mignon|tournedos|entrecote/],
  ['salade',/salade/],['ragout',/ragout|braise|bourguignon/]];
const famOf = r => { if(!r || !r.n) return ''; const t = norm(r.n); const f = FAMS.find(([,re]) => re.test(t)); return f ? f[0] : ''; };
const TY_MAX = {mex:2, sandwich:2, riz:2, pates:2};
/* ressemblance de deux soupers : deux soirs de suite (et le dîner du lendemain, qui mange les restes) */
function simR(a, b){
  if(!a || !b) return 0; let s = 0; const fa = famOf(a);
  if(fa && fa===famOf(b)) s += 5;
  const ta = a.t||'viande'; if(ta!=='viande' && ta!=='complet' && ta===(b.t||'viande')) s += 3;
  const pa = protein(a); if(pa!=='autre' && pa===protein(b)) s += 2;
  return s;
}
const gapDays = (a, b) => Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00'))/864e5);
/* Échange les jours des soupers pour éviter deux soirs de suite qui se ressemblent.
   Les plats longs restent aux jours de congé; les restes planifiés viennent 2 ou 3 jours après la grosse pièce. */
function spreadDays(){
  const L = mlist('items').filter(x => x.d), at = new Map(L.map(x => [x.d, x])), R = x => byName(x.r);
  const cost = () => { let c = 0;
    at.forEach((x, d) => { const y = at.get(addDays(d, 1)); if(y) c += simR(R(x), R(y)); });
    L.forEach(x => { if(!x.after) return; const pa = L.find(y => y.r===x.after); if(!pa) return; const g = gapDays(pa.d, x.d); c += g < 1 ? 99 : g===1 ? 3 : g===4 ? 1 : g >= 5 ? 6 : 0; });
    return c; };
  const mov = L.filter(x => !x.dfix), okAt = (x, d) => { const r = R(x); return !(r && isLong(r) && !isOff(d)); };
  const sw = (a, b) => { const t = a.d; a.d = b.d; b.d = t; at.set(a.d, a); at.set(b.d, b); };
  for(let k = 0; k < 40; k++){
    const c0 = cost(); let best = 0, bp = null;
    for(let i = 0; i < mov.length; i++) for(let j = i+1; j < mov.length; j++){
      const a = mov[i], b = mov[j]; if(!okAt(a, b.d) || !okAt(b, a.d)) continue;
      sw(a, b); const g = c0 - cost(); sw(a, b); if(g > best){ best = g; bp = [a, b]; } }
    if(!bp) break; sw(bp[0], bp[1]);
  }
}

/* ---------- jours de la semaine ---------- */
const addDays = (iso, n) => { const d = new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const weekDates = () => Array.from({length:7}, (_,k) => addDays(weekStart(), k));
const isOff = iso => (S.p.off||[0,6]).includes(new Date(iso+'T12:00:00').getDay());
const dayLbl = iso => { try{ return cap(new Date(iso+'T12:00:00').toLocaleDateString('fr-CA',{weekday:'long', day:'numeric'})); }catch(e){ return iso; } };
const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
/* Chaque souper reçoit un jour : les plats longs vont aux jours de congé, les restes après la grosse pièce. */
function assignDays(force){
  const L = mlist('items'), dates = weekDates(), seen = new Set();
  if(force) L.forEach(x => { if(!x.dfix) delete x.d; });
  L.forEach(x => { if(!x.d || !dates.includes(x.d) || seen.has(x.d)) delete x.d; else seen.add(x.d); });
  const todo = L.filter(x => !x.d); if(!todo.length) return;
  const pick = dates.filter(d => !seen.has(d)).slice(0, todo.length);
  const isFol = x => x.after && L.some(y => y.r===x.after);
  const main = todo.filter(x => !isFol(x)).sort((a,b) => ((byName(b.r)||{}).rs?1:0) - ((byName(a.r)||{}).rs?1:0)), fol = todo.filter(isFol);
  const take = off => { const i = pick.findIndex(d => isOff(d)===off); return i>=0 ? pick.splice(i,1)[0] : pick.shift(); };
  main.filter(x => { const r = byName(x.r); return r && isLong(r); }).forEach(x => { x.d = take(true); });
  main.filter(x => !x.d).forEach(x => { x.d = take(false); });
  fol.forEach(x => { const p = L.find(y => y.r===x.after); let i = -1;
    if(p && p.d){ for(const k of [2,3,1,4]){ i = pick.indexOf(addDays(p.d, k)); if(i >= 0) break; } if(i < 0) i = pick.findIndex(d => d > p.d); }
    x.d = i>=0 ? pick.splice(i,1)[0] : pick.shift(); });
  /* les restes planifiés viennent toujours après le plat qui les produit */
  fol.forEach(x => { const p = L.find(y => y.r===x.after); if(p && p.d && x.d && x.d < p.d && !p.dfix && !x.dfix && !(isLong(byName(p.r)||{}) && !isOff(x.d))){ const t = p.d; p.d = x.d; x.d = t; } });
  L.forEach(x => { if(!x.d) delete x.d; });
  if(force) spreadDays();
}
/* Déjeuners : les plus longs (crêpes, pain doré…) vont aux jours de congé. */
const dejDays = () => { const ds = weekDates(), n = Math.min(7, S.p.nDej||0); return ds.filter(isOff).concat(ds.filter(d => !isOff(d))).slice(0, n).sort(); };
function assignDej(force){
  const L = mlist('dej'), ds = weekDates(), seen = new Set();
  if(force) L.forEach(x => { if(!x.dfix) delete x.d; });
  L.forEach(x => { if(!x.d || !ds.includes(x.d) || seen.has(x.d)) delete x.d; else seen.add(x.d); });
  const todo = L.filter(x => !x.d); if(!todo.length) return;
  const pref = dejDays().filter(d => !seen.has(d)), pick = pref.concat(ds.filter(d => !seen.has(d) && !pref.includes(d)));
  const take = () => { const i = pick.findIndex(d => isOff(d)); return i>=0 ? pick.splice(i,1)[0] : pick.shift(); };
  const R = x => byName(x.r)||{}, tk = off => { const i = pick.findIndex(d => isOff(d)===off); return i>=0 ? pick.splice(i,1)[0] : pick.shift(); };
  todo.filter(x => !isSimple(R(x))).sort((a,b) => tmOf(R(b)) - tmOf(R(a))).forEach(x => { const d = tk(true); if(d) x.d = d; });
  todo.filter(x => isSimple(R(x))).forEach(x => { const d = tk(false); if(d) x.d = d; });
}
/* ---------- dîners : les restes du souper de la veille d'abord ----------
   Chaque souper est cuisiné pour le souper + les restes (Réglages). Le midi suivant, on mange ces restes.
   Les jours de dîner sans restes reçoivent une recette de la banque des soupers (pas déjà au menu). */
const dinDays = () => { const ds = weekDates(), n = Math.min(7, S.p.nDin||0), no = S.menu.dinNo||{}; return ds.filter(d => !isOff(d)).concat(ds.filter(isOff)).slice(0, n).filter(d => !no[d]).sort(); };
function restesAvail(d){
  if(S.p.dinRestes===false || !(S.p.restes > 0) || !d) return null;
  const it = mlist('items').find(x => x.d===addDays(d, -1));
  return it && (!it.pt || it.pt > (S.p.souper||4)) ? it : null;
}
const restesFor = d => (S.menu.dinCook||{})[d] ? null : restesAvail(d);
const dinNeed = () => dinDays().filter(d => !restesFor(d));
function dinPlan(){
  const L = mlist('din'), days = new Set(dinDays()); L.forEach(x => { if(x.d) days.add(x.d); });
  return [...days].sort().map(d => { const i = L.findIndex(x => x.d===d); return i>=0 ? {d, it:L[i], i} : restesFor(d) ? {d, rest:restesFor(d)} : {d}; })
    .concat(L.map((it,i) => ({d:'', it, i})).filter(x => !x.it.d));
}
function fillDin(n, keep, ban){
  const items = keep.slice(), taken = new Set(items.map(x => x.r)), banned = new Set([...recentSet(), ...taken, ...(ban||[])]);
  const ok = r => kindOf(r)==='souper' && !S.dis[r.n] && !softBad(r) && !r.ur && !r.rs && !r.pp && tpOf(r) <= Math.max(30, S.p.maxTm||35) && tmOf(r) <= 60;
  let pool = allRecipes().filter(r => ok(r) && !banned.has(r.n));
  if(pool.length < n - items.length) pool = allRecipes().filter(r => ok(r) && !taken.has(r.n) && !(ban||new Set()).has(r.n));
  const prot = {}, fams = new Set(), typs = {};
  const note = r => { const p = protein(r); prot[p] = (prot[p]||0)+1; const f = famOf(r); if(f) fams.add(f); const t = r.t||'viande'; typs[t] = (typs[t]||0)+1; };
  items.concat(mlist('items')).forEach(x => { const r = byName(x.r); if(r) note(r); });
  const add = r => { const it = mkItem(r, usedSides(items), pickVar(r)); it.din = true; items.push(it); taken.add(r.n); note(r); };
  const bad = (r, lvl) => { const f = famOf(r), t = r.t||'viande'; if(f && fams.has(f)) return true;
    if(lvl===0){ const p = protein(r); if(p!=='autre' && (prot[p]||0) >= 3) return true; if(TY_MAX[t]!==undefined && (typs[t]||0) >= TY_MAX[t]) return true; }
    return false; };
  const C = pool.map(r => ({r, s:score(r)})).sort((a,b) => b.s-a.s).map(x => x.r);
  [0,1].forEach(lvl => C.forEach(r => { if(items.length >= n || taken.has(r.n) || bad(r, lvl)) return; add(r); }));
  C.forEach(r => { if(items.length < n && !taken.has(r.n)) add(r); });
  return items;
}
function syncDin(force){
  const m = S.menu; if(!m.date) return;
  m.din = m.din || []; m.dinCook = m.dinCook || {}; m.dinNo = m.dinNo || {};
  const ds = weekDates(); ['dinCook','dinNo'].forEach(k => Object.keys(m[k]).forEach(d => { if(!ds.includes(d)) delete m[k][d]; }));
  const L = m.din, need = dinNeed(), seen = new Set();
  if(force) L.forEach(x => { if(!x.dfix) delete x.d; });
  L.forEach(x => { x.din = true; if(x.d && ds.includes(x.d) && (need.includes(x.d) || x.dfix) && !seen.has(x.d)) seen.add(x.d); else delete x.d; });
  const free = need.filter(d => !seen.has(d));
  L.filter(x => !x.d).forEach(x => { if(free.length) x.d = free.shift(); });
  if(m.achete) return;
  m.din = L.filter(x => x.d || x.lock);
  if(free.length){
    const nl = fillDin(m.din.length + free.length, m.din, new Set(mlist('items').map(x => x.r)));
    nl.forEach(x => { if(!x.d && !x.lock && free.length) x.d = free.shift(); });
    m.din = nl.filter(x => x.d || x.lock);
  }
}
/* appelé à chaque affichage : jours, déjeuners ajoutés après une mise à jour, dîners selon les restes */
function syncMeals(){
  const m = S.menu; if(!m.date) return false;
  const key = () => JSON.stringify([m.items, m.din, m.dej, m.des, m.dinCook]), before = key();
  m.dej = m.dej || []; m.din = m.din || [];
  if(m.fillNew){ delete m.fillNew; if(!m.achete) m.dej = fill(nOf('dej'), m.dej, 'dej'); }
  if(!m.achete) ['dej','des'].forEach(l => { const L = m[l]||[], bad = L.filter(x => { const r = byName(x.r); return !x.lock && r && (l==='dej' ? isSimple(r) && x.d && isOff(x.d) : !simpleOk(r)); });
    if(!bad.length) return; const keep = L.filter(x => !bad.includes(x)), nl = fill(L.length, keep, l, new Set(bad.map(x => x.r)));
    if(nl.length < L.length) return; nl.slice(keep.length).forEach((x, j) => { const b = bad[j]; if(b && b.d && !nl.some(y => y!==x && y.d===b.d)) x.d = b.d; }); m[l] = nl; });
  if(!m.achete) ['items','din'].forEach(l => (m[l]||[]).forEach((it, i, L) => { const r = byName(it.r), sd = sideById(it.sf);
    if(!r || !sd || sd.id===r.sf || (it.man||{}).f || (it.ovr||{}).f || !clash(sd, r)) return;
    const nf = chooseSide(r, 'f', usedSides(L.filter((_,j) => j!==i))); if(nf !== it.sf && !clash(sideById(nf), r)) it.sf = nf; }));
  assignDays(false); assignDej(false); syncDin(false);
  return key() !== before;
}
/* ---------- cuisiner une fois, manger deux fois ---------- */
const urMatch = (phrases, name) => (phrases||[]).some(ph => norm(ph).split(' ').every(w => norm(name).includes(w)));
const pairs = (rp, rf) => !!(rp && rf && rp.rs && rf.ur && rf.ur.some(u => rp.rs.w.includes(u)));
const primOf = it => it.after && S.p.reste!==false ? mlist('items').find(x => x.r===it.after) || null : null;
const follOf = it => S.p.reste!==false ? mlist('items').find(x => x.after===it.r) || null : null;
function pickFollow(rp, taken, avoid){
  const fp = famOf(rp), pen = r => { const f = famOf(r); return (f && (f===fp || (avoid && avoid.has(f))) ? 3 : 0) + ((r.t||'viande')!=='viande' && r.t===rp.t ? 1.5 : 0); };
  const c = allRecipes().filter(r => kindOf(r)==='souper' && !taken.has(r.n) && !S.dis[r.n] && !softBad(r) && ppOk(r) && simpleOk(r) && !r.pp && pairs(rp, r)).map(r => ({r, s:score(r) - pen(r)})).sort((a,b) => b.s-a.s);
  return c.length ? c[0].r : null;
}
function linkFollow(it){
  const r = byName(it.r); if(!r || !r.ur || it.after || S.p.reste===false) return;
  const p = mlist('items').find(x => x!==it && pairs(byName(x.r), r) && !mlist('items').some(y => y.after===x.r));
  if(p) it.after = p.r;
}
/* ---------- plats préparés, notes, prix ---------- */
const ppOk = r => !r.pp || S.p.pp==='all' || (S.p.pp==='spec' && dealsOf(r).length>0);
/* déjeuners et desserts simples : seulement si permis dans Réglages */
const isSimple = r => !!(r && (r.sp || (kindOf(r)==='dessert' && r.pp)));
const simpleOk = r => !isSimple(r) || kindOf(r)!=='dessert' || !!S.p.desSimple;
const softBad = r => { const rt = S.rate[r.n]; return !!rt && rt.down>=2 && rt.down>rt.up; };
const priceOf = s => { const m = String(s && s.p || '').replace(',', '.').match(/\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : Infinity; };
const money = v => v.toFixed(2).replace('.', ',')+' $';

/* ---------- besoins, stock, achats ---------- */
const maisonList = () => S.maison.split(',').map(x => norm(x).trim()).filter(Boolean);
const MAISON_OK = new Set(['noir','noire','moulu','moulue','concasse','fin','fine','gros','jaune','vierge','extra','casher','mer','table','iode','neutre','canola','reguliere','regulier','doux','douce','grains','fraichement','moulin','pincee','legere','leger','sodium','reduit','faible']);
function isMaison(name){
  const parts = norm(name).replace(/\([^)]*\)/g,' ').split(/,| et /).map(s => s.trim()).filter(Boolean);
  const one = n => maisonList().some(m => { if(n===m) return true; if(!n.startsWith(m+' ')) return false;
    return n.slice(m.length).split(/[^a-z0-9]+/).filter(w => w && !STOPW.has(w)).every(w => MAISON_OK.has(w)); });
  return parts.length > 0 && parts.every(one);
}

function needs(){
  if(_ND) return _ND;
  const map = new Map();
  const add = (q,u,name,rayon,src) => { [q,u] = normQU(name,q,u); const k = keyOf(name,u); const o = map.get(k); if(o){ o.q += q; if(src && !o.src.includes(src)) o.src.push(src); } else map.set(k,{k,q,u,name,rayon:classer(name, rayon),src:src?[src]:[]}); };
  allItems().forEach(it => { fullIngs(it).forEach(g => add(g.q,g.u,g.name,g.rayon,it.r)); });
  Object.keys(S.menu.useup||{}).forEach(k => { const st = S.stock[k]; if(st) add(st.q, st.u, st.name, st.rayon, 'Restes à manger'); });
  if(S.menu.date){
    S.snacks.forEach(s => add(s.q*S.p.jours, s.u, s.name, s.r, 'Collations'));
    S.ess.forEach(s => add(s.q, s.u, s.name, s.r, s.c || 'Essentiels'));
    (S.menu.sn||[]).forEach(s => add(s.q, s.u, s.name, s.r, s.src || 'Collations en spécial'));
  }
  return (_ND = [...map.values()]);
}
function buyList(){
  if(_BL) return _BL;
  const rows = [], covered = [], verify = [];
  const avail = {}; Object.entries(S.stock).forEach(([k,o]) => avail[k] = o.q);
  for(const n of needs()){
    const ex = S.menu.extra[n.k];
    if(isMaison(n.name)){ verify.push({...n, manque: !!ex}); if(!ex) continue; }
    const sk = ex ? null : stockKey(n); const st = sk ? avail[sk] : 0;
    if(sk) avail[sk] = Math.max(0, avail[sk] - n.q);
    let def = ex ? n.q : n.q - st;
    if(def <= 0.001){ covered.push({...n, st}); continue; }
    const plan = planBuy(n.name, n.u, def), p = plan ? 0 : packOf(n.name,n.u);
    const buy = plan ? plan.buy : p ? Math.ceil(def/p - 1e-9)*p : n.u==='un' ? Math.max(1, Math.ceil(def - 0.05)) : def;
    rows.push({...n, st, buy, def, plan});
  }
  return (_BL = {rows, covered, verify});
}
const isoToday = () => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
/* début de la semaine du menu : la date d'épicerie choisie, sinon le jour où le menu a été créé (les jours ne glissent plus chaque jour) */
const shopISO = () => S.dates.shop || isoToday();
const weekStart = () => S.dates.shop || (S.menu && S.menu.date && S.menu.start) || isoToday();
const fmtDate = iso => { try{ return new Date(iso+'T12:00:00').toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ return iso; } };
const nice = t => { t = String(t).trim(); return t.charAt(0).toUpperCase()+t.slice(1).toLowerCase(); };
const cap = t => { t = String(t); return t.charAt(0).toUpperCase()+t.slice(1); };
/* Épiceries de la semaine : les favorites (Réglages) moins celles décochées sur la carte de la semaine. */
const goStores = () => S.stores.filter(s => !(S.skip||[]).includes(s));
/* produits de pharmacie et d'entretien qui partagent un mot avec un aliment (« crème », « savon au lait »…) */
const NONFOOD = /\b(eucerin|nivea|aveeno|cetaphil|cerave|neutrogena|olay|vaseline|gillette|colgate|crest|oral-?b|listerine|sensodyne|tampax|kotex|pampers|huggies|kleenex|cottonelle|charmin|scotties|purex|tide|downy|bounce|sunlight|cascade|lysol|clorox|javex|febreze|glad|ziploc|duracell|energizer|garnier|pantene|aussie|tresemme|old spice|speed stick|tylenol|advil|motrin|reactine|centrum|jamieson|polysporin|vicks|benadryl|gaviscon|lubriderm|jergens|bioderma|vichy|la roche-posay|marcelle|lise watier|revlon|maybelline|covergirl|l.oreal)\b|creme (pour les |a )?mains|creme (hydratante|pour le corps|pour le visage|solaire|a raser|de nuit|de jour|antirides|corporelle)|ecran solaire|\blotions?\b|shampo|revitalisant|deodorant|antisudorifique|dentifrice|brosse a dents|rince-bouche|\bsavons?\b|gel douche|nettoyant|detergent|assouplissant|papier hygienique|essuie-tout|mouchoirs|couches(-culottes| pour| jetables)|lingettes|serviettes hygieniques|protege-dessous|rasoirs?\b|maquillage|mascara|vernis|eau de (toilette|parfum)|vitamines?\b|multivitamine|analgesique|comprimes|sirop contre la toux|\bpiles?\b|ampoules?\b|litiere|nourriture pour (chien|chat)|sacs a ordures|sacs poubelle|papier d.aluminium|pellicule plastique|soins? (de la peau|capillaires?)|\bbaume\b|cosmetique|teinture|coloration capillaire/;
const isFood = t => !NONFOOD.test(norm(t||''));
function autoItems(){ if(!S.auto) return []; const d = shopISO(), go = goStores(); return S.auto.items.filter(i => isFood(i.t) && (S.auto.anyDate || ((!i.vt || i.vt >= d) && (!i.vf || i.vf <= d))) && (!S.stores.length || go.includes(i.s))); }
let _AS = null;
const allSpec = () => _AS || (_AS = S.spec.filter(s => !s.s || !(S.skip||[]).includes(s.s)).map(s => ({s:s.s, t:s.t, p:''})).concat(autoItems().map(i => ({s:i.s, t:nice(i.t), p:i.p||'', d:i.d||0, per:i.per||''}))));
const specTxt = s => s.t+(s.p ? ' à '+s.p : '')+' ('+s.s+')';
/* Mots composés qui changent d'aliment : « Pommes » ne doit pas prendre le spécial « Pommes de terre ». */
const COMPOUNDS = ['pomme de terre','beurre d\'arachide','creme glacee','creme sure','lait de coco','noix de coco','fromage a la creme','pain de viande','sucre a glacer','pate a tarte'];

/* Prix de référence : voir prix-maxi.js (PRIX, PRIX_DEF, BASE, BAREME, PRIX_MAJ). */
const PRIX_MAJ_TXT = () => { try{ return 'relevé du ' + new Date(PRIX_MAJ+'T12:00:00').toLocaleDateString('fr-CA', {day:'numeric', month:'long', year:'numeric'}); }catch(e){ return PRIX_MAJ; } };
const prixVieux = () => { try{ return gapDays(PRIX_MAJ, isoToday()) > 120; }catch(e){ return false; } };
const _BMC = new Map();
function baremeOf(name){
  const n = norm(name); if(_BMC.has(n)) return _BMC.get(n);
  const b = BAREME.find(x => x[0].test(n)) || null; _BMC.set(n, b); return b;
}
/* meilleure façon d'acheter q avec les formats F : un format, ou un gros format complété par un plus petit */
function bestFormats(q, F){
  const tol = 0.03;
  const best = (rest, G) => {   /* un format seul, ou n gros formats complétés par les plus petits */
    let B = null; const keep = o => { if(!B || o.cost < B.cost - 1e-9 || (Math.abs(o.cost - B.cost) < 1e-9 && o.fmt.length < B.fmt.length)) B = o; };
    G.forEach(([s,p]) => { const c = Math.max(1, Math.ceil(rest/s - tol)); keep({cost:c*p, fmt:[[s, c]]}); });
    G.forEach(([s,p]) => { const n = Math.floor(rest/s + tol), r = rest - n*s; if(n < 1 || r <= s*tol) return;
      const H = G.filter(x => x[0] < s); if(!H.length) return; const o = best(r, H); keep({cost:n*p + o.cost, fmt:[[s, n]].concat(o.fmt)}); });
    return B;
  };
  const b = best(q, F); return {cost:b.cost, fmt:b.fmt, buy:b.fmt.reduce((t,[s,c]) => t + s*c, 0)};
}
/* les formats à acheter pour une ligne (null si l'article se vend au poids ou n'est pas au barème) */
function planBuy(name, u, q){
  const A = art(name); if(A.pk && A.pk.q > 0) return null;
  const b = baremeOf(name); if(!b || !b[1].f || b[1].u!==u || q <= 0) return null;
  if(u==='un' && PKG_RE.test(norm(name))) return null;
  return bestFormats(q, b[1].f);
}
/* prix régulier d'une ligne d'après le barème (null si absent) */
function baremeCost(r){
  const b = baremeOf(r.name); if(!b) return null; const o = b[1], n = norm(r.name);
  if(o.kg){ const g = r.u==='g' ? r.buy : r.u==='un' ? r.buy * (gpuOf(n) || o.gpu || 0) : 0; return g ? g/1000*o.kg : null; }
  if(r.u===o.u) return bestFormats(r.buy, o.f).cost;
  if(r.u==='un' && o.u==='g' && gpuOf(n)) return bestFormats(r.buy*gpuOf(n), o.f).cost;
  if(r.u==='un') return r.buy * o.f[0][1];   /* un « un » = un format */
  return null;
}
const baremeTxt = name => { const b = baremeOf(name); if(!b) return ''; const o = b[1];
  return (o.kg ? `${money(o.kg)} / kg` : o.f.map(([s,p]) => `${o.u==='un' ? (s===1 ? "l'unité" : 'paquet de '+s) : fq(s, o.u)} : ${money(p)}`).join(' · ')) + (o.e ? ' (estimé)' : ''); };
/* prix par unité de base (par g, par ml ou à l'unité) */
function prixBase(name, u, ray){
  const n = norm(name), hit = PRIX.find(([re]) => re.test(n)), [b, f] = BASE[u] || ['un',1];
  if(hit && hit[1][b] !== undefined) return hit[1][b]/f;
  const d = PRIX_DEF[ray] || PRIX_DEF['épicerie'];
  return (d[b] !== undefined ? d[b] : (d.un || 4))/f;
}
let _ECO = new Map(), _ASA = null, _CMP = new Map(), prEdit = '';
/* Articles comptés à l'unité mais vendus en paquet : le prix d'une circulaire est celui du paquet (douzaine d'oeufs, 8 pains…). */
const PKG_RE = /\((sac|boite|paquet|emballage|regime|caisse|gros sac|pot|bouteille|contenant)|\b(sac|sachet|boite|paquet|caisse|pot|bouteille|emballage|contenant|botte|barquette|plateau)(s|x)? (de|d')|ou muffins anglais/;
const PACK_UN = [[/\boeufs?\b/,12],[/tranches? de pain/,20],[/tranches? de (fromage|cheddar)|fromage tranche/,16],[/pains? (a hamburger|a hot-dog|kaiser)|petits pains|sliders/,8],[/pains? sous-marin/,6],
  [/tortillas?/,10],[/coquilles a tacos/,12],[/saucisses? a hot-dog/,12],[/pitas?/,6],[/naan/,4],[/bagels|muffins anglais/,6],[/croissants?/,6],[/fromage ficelle|batonnets de fromage/,12],
  [/compotes? de pommes/,6],[/feuilles de laitue/,15],[/coeurs de romaine/,3],[/abaisses?/,2],[/croquettes|pogo/,8]];
/* poids moyen d'une unité (g), pour les formats au poids et les prix à la livre */
const GPU = [[/poitrines? de poulet/,225],[/hauts? de cuisses?|cuisses? de poulet/,120],[/pilons?/,110],[/cotelettes?/,200],[/steaks?/,250],[/saucisses? a hot-dog/,45],[/saucisses?/,100],
  [/filets? de (saumon|poisson|morue|aiglefin|tilapia|truite|sole)/,150],[/oignons?/,150],[/carottes?/,75],[/tomates?/,120],[/patates? douces?/,300],[/pommes de terre|patates/,200],[/poivrons?/,170],
  [/pommes/,180],[/poires/,180],[/oranges/,150],[/clementines/,80],[/citrons?/,100],[/limes?/,70],[/avocats?/,170],[/bananes?/,120],[/concombres?/,300],[/courgettes?/,250],[/brocoli/,450],[/chou-fleur/,800],[/mangues?/,300]];
const gpuOf = n => (GPU.find(([re]) => re.test(n)) || [])[1] || 0;
function countIn(t){
  let m = t.match(/(\d+)\s*x\s*\d/); if(m) return +m[1];
  m = t.match(/(\d+)\s*(un|unites|mcx|morceaux|tranches|oeufs|saucisses|tortillas|pitas|pains|bagels|croissants|muffins|portions|sachets|canettes|bouteilles|boites|emb|pqt|ct)\b/); if(m) return +m[1];
  if(/douzaine/.test(t)) return 12;
  m = t.match(/(?:^|\s)(\d{1,2})\s*$/); if(m && +m[1] >= 2 && +m[1] <= 60) return +m[1];
  return 0;
}
/* unités par paquet : lues dans le nom du spécial, déduites de son poids, sinon le format courant */
function unitsPer(row, t){
  const n = norm(row.name); const c = t ? countIn(t) : 0; if(c) return c;
  const A = art(row.name); if(A.pk && A.pk.u==='un' && A.pk.q > 0) return A.pk.q;
  const gpu = gpuOf(n), sz = t && t.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|lb)\b/);
  if(gpu && sz) return Math.max(1, Math.round(parseFloat(sz[1].replace(',','.')) * ({kg:1000, g:1, lb:454})[sz[2]] / gpu));
  const d = PACK_UN.find(([re]) => re.test(n)); return d ? d[1] : 0;
}
/* coût d'un spécial pour la quantité de la ligne : format lu dans le nom, format courant, sinon à la livre pour la viande et le poisson */
function dealCost(s, row){
  const pr = priceOf(s); if(!isFinite(pr)) return null;
  const t = norm(s.t), sz = t.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|lb|l|ml)\b/);
  /* prix au poids (« 3,88 /lb ») : coût = poids nécessaire × prix */
  if(s.per==='lb' || s.per==='kg'){ const g = row.u==='g' ? row.buy : row.u==='un' ? row.buy * (gpuOf(norm(row.name)) || 0) : 0; if(g) return pr * g / (s.per==='lb' ? 453.6 : 1000); }
  const mult = (() => { const m = t.match(/(\d+)\s*[x×]\s*\d/); return m && +m[1] > 1 && +m[1] <= 48 ? +m[1] : 1; })();
  if(row.u==='un'){
    const n = norm(row.name);
    if(PKG_RE.test(n)) return pr * row.buy;
    const per = unitsPer(row, t); if(per) return pr * Math.max(1, Math.ceil(row.buy/per - 0.05));
    const gpu = gpuOf(n);
    if(gpu && /viandes|poissonnerie/.test(row.rayon||'')) return pr * row.buy * gpu / 454;
    const ue = prixBase(row.name, 'un', row.rayon);
    if(gpu && pr > 2.2*ue) return pr * row.buy * gpu / 454;
    if(ue > 0 && pr >= 3*ue) return pr * Math.max(1, Math.ceil(row.buy / Math.max(2, Math.round(pr/ue)) - 0.05));
    return pr * row.buy;
  }
  if(sz){
    let size = parseFloat(sz[1].replace(',','.')) * ({kg:1000, g:1, lb:454, l:1000, ml:1})[sz[2]] * mult;
    if((sz[2]==='l' || sz[2]==='ml') !== (row.u==='ml')) size = 0;
    if(size) return pr * Math.max(1, Math.ceil(row.buy/size - 0.05));
  }
  const pk = packOf(row.name, row.u); if(pk) return pr * Math.max(1, Math.ceil(row.buy/pk - 0.05));
  if(row.u==='g' && /viandes|poissonnerie/.test(row.rayon||'')) return pr * row.buy/454;
  /* format absent du nom : on suppose le format courant du barème */
  const bf = baremeOf(row.name); if(bf && bf[1].u===row.u && bf[1].f && bf[1].f[0][0] > 0) return pr * Math.max(1, Math.ceil(row.buy/bf[1].f[0][0] - 0.05));
  return pr;
}
/* « 4 douzaines », « 2 paquets de 8 », « ≈ 6 paquets de 375 g » sous l'article */
function packInfo(r){
  const d = dealFor(r.name), t = d ? norm(d.t) : '', n = norm(r.name);
  if(r.plan && !d){ const F = r.plan.fmt; if(r.u==='un'){ if(F.every(([s]) => s===1)) return ''; if(F.length===1 && F[0][0]===12 && /\boeuf/.test(n)) return F[0][1]===1 ? '1 douzaine' : `${F[0][1]} douzaines`; }
    return F.map(([s,c]) => r.u==='un' ? `${c} paquet${c>1?'s':''} de ${s}` : `${c} × ${fq(s, r.u)}`).join(' + '); }
  if(r.u==='un'){
    if(PKG_RE.test(n)) return '';
    const per = unitsPer(r, t); if(per < 2 || r.buy < 2) return '';
    const np = Math.max(1, Math.ceil(r.buy/per - 0.05));
    if(per===12 && /\boeuf/.test(n)) return np===1 ? '1 douzaine' : `${np} douzaines`;
    return `${np} paquet${np>1?'s':''} de ${per}`;
  }
  const sz = t.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|lb|l|ml)\b/); let size = 0;
  if(sz){ size = parseFloat(sz[1].replace(',','.')) * ({kg:1000, g:1, lb:454, l:1000, ml:1})[sz[2]]; if((sz[2]==='l' || sz[2]==='ml') !== (r.u==='ml')) size = 0; }
  if(!size) size = packOf(r.name, r.u);
  if(!size && r.u==='g' && /viandes|poissonnerie/.test(r.rayon||'') && r.buy >= 200) return `≈ ${String(Math.round(r.buy/453.6*10)/10).replace('.', ',')} lb`;
  if(!size || r.buy < size*1.5) return '';
  const np = Math.max(1, Math.ceil(r.buy/size - 0.05));
  return `≈ ${np} paquets de ${fq(size, r.u)}`;
}
/* prix habituel de la ligne : ton prix noté, sinon l'estimation */
function costEst(r){ const L = (S.prices||{})[r.k], mine = L && !L.sp;
  if(!mine){ if(r.plan) return r.plan.cost; const bc = baremeCost(r); if(bc != null) return bc; }
  let q = r.buy; if(r.u==='un' && !mine){ const n = norm(r.name), A = art(r.name); if(!PKG_RE.test(n)){ const d = A.pk && A.pk.u==='un' && A.pk.q > 0 ? [0, A.pk.q] : PACK_UN.find(([re]) => re.test(n)); if(d) q = Math.max(1, Math.ceil(r.buy/d[1] - 0.05)) * d[1]; } }   /* vendu au paquet */
  return (mine ? L.pu : prixBase(r.name, r.u, r.rayon)) * q; }
function rowEco(r){
  if(_ECO.has(r.k)) return _ECO.get(r.k);
  const L = (S.prices||{})[r.k], d = dealFor(r.name), est = costEst(r);
  let cost = est, reg = est;
  /* un « spécial » sans rabais connu qui coûte nettement plus que le prix habituel est ignoré (mauvais format ou mauvais produit) */
  if(d){ const dc = dealCost(d, r); if(dc != null && (d.d > 0 || dc <= est*1.15 || (L && !L.sp))){ cost = dc; reg = d.d > 0 && d.d < 95 ? dc/(1 - d.d/100) : Math.max(est, dc); } }
  const o = {cost, reg, save:Math.max(0, reg-cost), mine: !!(L && !L.sp), deal: d};
  _ECO.set(r.k, o); return o;
}
function listTotals(rows){ let cost = 0, save = 0; rows.forEach(r => { const e = rowEco(r); cost += e.cost; save += e.save; }); return {cost, save}; }
/* toutes les circulaires de tes épiceries, même celles où tu ne vas pas cette semaine (pour comparer) */
const allSpecAll = () => _ASA || (_ASA = S.spec.map(s => ({s:s.s, t:s.t, p:'', d:0})).concat(S.auto ? S.auto.items.filter(i => { const d = shopISO(); return isFood(i.t) && (S.auto.anyDate || ((!i.vt || i.vt >= d) && (!i.vf || i.vf <= d))) && (!S.stores.length || S.stores.includes(i.s)); }).map(i => ({s:i.s, t:nice(i.t), p:i.p||'', d:i.d||0, per:i.per||''})) : []));
/* ---------- association d'un article à un spécial ----------
   On compare des mots entiers (« lait » ne prend pas « laitue », « oeuf » ne prend pas « boeuf »).
   Tous les mots importants de l'article doivent être dans le spécial. Un spécial qui annonce une autre forme du produit
   (pané, haché, sauce, soupe, jus, chips…) est écarté si l'article ne la nomme pas, sauf dans « X ou Y ».
   L'onglet Articles permet de choisir le bon spécial, d'en retenir un produit, de changer les mots ou d'en exclure. */
const STOPW = new Set(['de','du','des','la','le','les','a','au','aux','et','en','d','l','pour','avec','sur','un','une','x','g','kg','ml','lb','oz','ou','par','sans','dans','ch','chacun','prix','special']);
const OPTW = new Set(['endes','cru','crue','decortique','decortiquee','deveine','deveinee','frais','fraiche','gros','grosse','moyen','moyenne','petit','petite','nature','regulier','reguliere','classique','original','originale','extra','desosse','peau','maigre','mi','surgele','rape','tranche','bio','biologique','familial','format','choix','filet','mur','mure','blanc','blanche','jaune','rouge','vert','verte','emince','coupe','piece','tout','usage','lave','bebe','mini','jumbo','paquet','boite','sac','emballage','regime','caisse','pot','bouteille','contenant','barquette','unite','portion','individuel','individuelle','lunch','lunchs','dejeuner','dejeuners','collation','famille','roties','rotie','cuit','cuite','congele']);
const FORMW = new Set(['hache','roti','steak','cotelette','cote','poitrine','cuisse','haut','pilon','aile','epaule','longe','saucisse','bacon','cube','laniere','pane','croquette','burger','boulette','bouillon','soupe','sauce','assaisonnement','marinade','marine','chip','croustille','biscuit','barre','jus','boisson','yogourt','creme','glace','gateau','muffin','tarte','pizza','lasagne','repas','sandwich','vinaigrette','trempette','tartinade','poudre','sirop','nourriture','chien','chat','compote','puree','broye','pain','hamburger','dog','baguette','bagel','croissant','tortilla','pita','naan','brioche','salade','chocolat','the','cafe','cereale','granola','nouille','sec','seche','bbq','kit','melange','gelee','confiture','dinde','latte','cappuccino','frappuccino','capsule','tartiner','teriyaki','aigre','carbonara','frit','frite','tao','shawarma','plat','simili','stroganov','mein','pastrami','garni','farci','fume','endes','conserve','collation','fouette','vegetale','vegetal','patissiere','evapore','concentre','condense','aromatise','sucre','croquant','enrobe','glacage','fondant','friandise','bonbon','gomme','jujube','guimauve','surprise','kinder']);
const sing = w => w.length > 3 && /[sx]$/.test(w) && !/(ss|is|us|ais|ois|oix|as)$/.test(w) && !/^(gros|dos|repos|frais|sans|sous|endes)$/.test(w) ? w.slice(0,-1) : w;
/* corrections avant la normalisation (les accents distinguent pâté et pâtes) */
const rawFix = s => String(s||'').toLowerCase().replace(/(?<![a-zà-ÿ])p[âa]t[ée]s?(?![a-zà-ÿ])/g, m => /é/.test(m) ? 'terrine' : m).replace(/\ben d[ée]s\b/g, 'endes').replace(/\bpommes? terre\b/g, 'pomme de terre');
const toks = (s, keepParen) => { let t = norm(rawFix(s)); if(!keepParen) t = t.replace(/\([^)]*\)/g,' ');
  return t.replace(/['’]/g,' ').split(/[^a-z0-9%]+/).filter(w => w && !STOPW.has(w) && !/^\d/.test(w)).map(w => { w = sing(w); return w.length > 4 && w.endsWith('ee') ? w.slice(0,-1) : w; }); };
const reqToks = name => { const t = toks(name), r = t.filter(w => !OPTW.has(w)); return r.length ? r : t; };
const spId = s => s.s+'|'+norm(s.t);
const _PREP = new WeakMap();
/* ---------- association spécial ↔ article ----------
   Un nom de circulaire est découpé en « segments » : la partie anglaise (après « | ») et les tailles entre
   parenthèses sont retirées, puis le nom est coupé aux « ou » (« Carottes ou oignons jaunes » = 2 produits).
   Un article correspond à un segment seulement si son mot principal y est le produit lui-même :
   « Oeufs blancs » oui, mais pas « Nouilles aux oeufs », « Casserole d'oeufs » ni « Oeufs Kinder Surprise ». */
const CONNW = new Set(['de','d','du','des','a','au','aux','avec','en','sur','pour','et','farci','farcie','farcis','barde','bardee','bardes','enrobe','enrobee','fourre','fourree','saveur','style','facon','sauce']);
const ARTW = new Set(['la','le','les','l','un','une']);
/* mots de catégorie qui peuvent précéder le produit : « Fromage feta », « Riz basmati », « Huile d'olive » */
const CLASSW = new Set(['fromage','viande','poisson','legume','fruit','pate','nouille','riz','farine','huile','vinaigre','sucre','the','epice','fine','herbe','sauce','lait','creme','bouillon']);
/* compléments normaux après le produit : l'animal (« Saucisses de porc »), le liquide (« Thon à l'huile ») */
const POSTOK = new Set(['poulet','boeuf','porc','dinde','veau','agneau','canard','poisson','saumon','thon','morue','crevette','huile','eau','saumure','dos','surlonge','longe','epaule','cuisse','poitrine','lait','grain']);
/* produits souvent aromatisés : « Yogourt aux fraises », « Ketchup aux tomates » restent ces produits */
const FREEPOST = new Set(['yogourt','yogurt','ketchup','jus','the','cafe','tisane','compote','confiture','gruau','cereale','craquelin','biscuit','muffin','barre','vinaigrette','moutarde','soupe','bouillon','saucisse','pain','bagel','fromage','pouding','gelee','sirop','tartinade','trempette','salsa','mayonnaise']);
/* coupes et formats : « Poitrines de poulet », « Sac de carottes » restent du poulet et des carottes */
const CUTW = new Set(['poitrine','cuisse','haut','pilon','aile','filet','cube','laniere','epaule','longe','cotelette','cote','steak','roti','bavette','surlonge','tranche','morceau','jarret','contre','intérieur','interieur','exterieur','ronde','croupe','palette','flanc','cuisseau','gigot','carre','demi','quartier','tournedo','medaillon','escalope','brochette',
  'sac','paquet','paq','emb','bifteck','produit','preparation','entier','entiere','duo','assortiment','canette','minicanette','boite','caisse','emballage','barquette','format','tube','pot','bouteille','contenant','plateau','bloc','rouleau','douzaine','botte','regime','couronne','tete','pied','coeur','bouquet','grappe','casseau','livre','lb','kg','g','ml','l','economique','familial','gros','grosse','petit','petite']);
/* friandises et produits non alimentaires qui partagent des mots avec les aliments */
const CANDY_RE = /\b(kinder|surprise|friandises?|bonbons?|cadbury|lindt|ferrero|hershey|reese|smarties|m ?& ?m|mars|twix|kit ?kat|aero|caramilk|coffee crisp|toblerone|guimauves?|reglisses?|halloween|paques|jujubes?|gommes?)\b/;
const SMOKED = new Set(['bacon','jambon','saucisse','saucisson','kielbasa']);
const VARIETY = {
  fromage: {all:new Set(['chevre','feta','brie','camembert','oka','bocconcini','parmesan','mozzarella','mozzarellissima','gouda','suisse','havarti','ricotta','mascarpone','halloumi','cottage','raclette','bleu','emmental','kashkaval','tuma','provolone','gruyere','cheddar','colby','monterey','jack','tresse','grec','paneer','asiago','romano','fontina','swiss','cracker','vache','babybel','ficelle','quark']), def:new Set(['cheddar','mozzarella','mozzarellissima','colby','monterey','jack'])},
  lait: {all:new Set(['coco','amande','soya','soja','avoine','chocolat','riz','cajou','evapore','condense','beurre','frappe']), def:new Set()},
  riz: {all:new Set(['lait','croustillant','souffle','galette','cereale']), def:new Set()}
};
/* conserves : un article en boîte prend un spécial en boîte, pas le saumon frais */
const CANNED_RE = /\bboites?\b|conserve|\bcans?\b|canned|endes|\bpelee|\bpolpa\b|mutti|unico|aylmer|rio ?mare|clover|gold seal|cedar|fillo|clark|primo|del monte|green giant|pastene|\b(1[0-9]{2}|[2-9][0-9]{2}) ?ml\b|\b(8[5-9]|9[0-9]|1[0-9]{2}|2[01][0-9]) ?g\b/;
const CANNABLE = new Set(['tomate','saumon','thon','mais','pois','haricot','ananas','peche','poire','champignon','pomme','lentille','feve']);
const NAMEFIX = [[/\bou\s*\/\s*or\b/g, ' ou '], [/\b(\d+)\s*%/g, '$1pc']];
function nameSegs(t){
  let n = norm(rawFix(t)).split('|')[0]; NAMEFIX.forEach(([re, r]) => n = n.replace(re, r));
  n = n.replace(/\([^)]*\)/g, ' ').replace(/\b\d+(?:[.,]\d+)?\s*(?:x|×)\s*\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz)\b/g, ' ').replace(/\b\d+(?:[.,]\d+)?(?:\s*[-à\/]\s*\d+(?:[.,]\d+)?)?\s*(?:g|kg|ml|l|lb|oz|un|unites?)\b\.?/g, ' ');
  const tok = seg => seg.replace(/['’]/g, ' ').split(/[^a-z0-9]+/).filter(Boolean).map(w => { if(/^\d+pc$/.test(w)) return w; w = sing(w); return w.length > 4 && w.endsWith('ee') ? w.slice(0,-1) : w; }).filter(w => w==='et' || !/^\d/.test(w) || /pc$/.test(w));
  const out = [];
  /* les « ou » partagent souvent un mot : « Poitrines ou cuisses de poulet », « Lait 1 % ou 2 % », « Huile de canola ou végétale » */
  n.split(/;|\s-\s|,(?!\d)/).forEach(part => {
    const S = part.split(/\bou\b|\bor\b/).map(tok).filter(W => W.length); if(!S.length) return;
    const first = S[0][0], last = S[S.length-1], tail = last.slice(1);
    S.forEach((W, i) => { out.push(W);
      if(S.length > 1){ if(i > 0 && !W.includes(first)) out.push([first].concat(W)); if(i < S.length-1 && tail.length) out.push(W.concat(tail)); } });
  });
  return out;
}
let _PN = null;
/* noms de produits connus : un tel mot devant l'article (« Poulet au beurre » pour Beurre) change le produit */
function prodNouns(){
  if(_PN) return _PN;
  _PN = new Set([...FORMW].filter(w => !CUTW.has(w)).concat(['casserole','tartelette','chou','brownie','macaroni','beigne','nouille','pappardelle','linguine','spaghetti','penne','raviolis','ravioli','tortellini','gnocchi','roule','pate','pogo','quiche','tourtiere','pate','mousse','pouding','galette','crepe','gaufre','omelette','fondue','pizza','poutine','burrito','taco','nacho','wrap','hummus','houmous','tzatziki','charqui','minicroissant','croquant','poulet','boeuf','porc','dinde','veau','agneau','saumon','thon','crevette','fromage','beurre','lait','oeuf','riz','yogourt','legume','fruit','pomme','tomate','patate','oignon']));
  try{ catalog().forEach(c => { const r = reqToks(c.n); if(r[0] && r[0].length > 2) _PN.add(r[0]); }); }catch(e){}
  return _PN;
}
/* l'article (mots requis R, mot principal R[0]) est-il le produit de ce segment ? */
function segFits(R, mine, W){
  const PN = prodNouns(), head = R[0];
  if(!R.every(w => W.includes(w))) return false;
  const i = W.indexOf(head), pre = W.slice(0, i).filter(w => !ARTW.has(w));
  const j = pre.length && CONNW.has(pre[pre.length-1]) ? pre.length-1 : -1;   /* connecteur juste avant le produit */
  if(j >= 0){ const bef = pre.slice(0, j); if(!bef.length || !bef.every(w => CUTW.has(w) || CONNW.has(w))) return false; }
  else if(pre.some(w => PN.has(w) && !CONNW.has(w) && !mine.has(w) && !CUTW.has(w) && !OPTW.has(w) && !CLASSW.has(w))) return false;
  /* après le mot principal : « Beurre aux pois chiches », « Riz au lait » sont d'autres produits */
  const post = FREEPOST.has(head) ? [] : W.slice(i + 1);
  for(let k = 0; k < post.length; k++){
    if(!CONNW.has(post[k])) continue;
    let w = post[k+1]; let m = k+1; while(w && ARTW.has(w)){ m++; w = post[m]; }
    if(w && PN.has(w) && !mine.has(w) && !OPTW.has(w) && !CUTW.has(w) && !POSTOK.has(w)) return false;
  }
  /* forme ou préparation qui n'est pas dans le nom de l'article (pané, haché, en sauce…) */
  if(W.some(w => FORMW.has(w) && !mine.has(w) && !(w==='fume' && SMOKED.has(head)))) return false;
  /* variétés : « Fromage râpé » prend le cheddar ou la mozzarella, pas le chèvre ni le brie */
  const V = VARIETY[head];
  if(V){ const own = [...mine].some(w => V.all.has(w)), other = W.filter(w => V.all.has(w) && !mine.has(w));
    if(other.length && (own || !other.every(w => V.def.has(w)))) return false; }
  /* pourcentages : Crème 35 % ne prend pas la crème 10 %, Lait 2 % pas le lait 1 % */
  const pm = [...mine].filter(w => /pc$/.test(w)), pw = W.filter(w => /pc$/.test(w));
  if(pm.length && pw.length && !pm.some(w => pw.includes(w))) return false;
  return true;
}
function prep(list){
  let P = _PREP.get(list);
  if(!P){ P = list.map(s => { const tk = toks(s.t, true), sg = nameSegs(s.t), nt = norm(rawFix(s.t)); return {s, nt, tk:new Set(tk.concat(sg.flat())), segs:sg, f:tk.filter(w => FORMW.has(w)), b:baseOf(rawFix(s.t)), candy:CANDY_RE.test(nt), can:CANNED_RE.test(nt), canMark:/endes|\bpelee|\bpolpa\b|conserve|\bboites?\b/.test(nt), alt:/ ou /.test(nt)}; }); P.memo = new Map();
    /* index mot → spéciaux : on n'examine que les spéciaux qui contiennent le premier mot cherché */
    P.idx = new Map(); P.forEach(x => x.tk.forEach(w => { let a = P.idx.get(w); if(!a) P.idx.set(w, a = []); a.push(x); }));
    _PREP.set(list, P); }
  return P;
}
/* réglages d'un article (onglet Articles) */
const artB = name => baseOf(plain(name));
const art = name => (S.art||{})[artB(name)] || {};
const pcToks = name => (norm(name).match(/\b\d+\s*%/g) || []).map(x => x.replace(/\s*%/, 'pc'));
function dealCands(name, P){
  if(P.memo && P.memo.has(name)) return P.memo.get(name);
  const res = dealCands0(name, P); if(P.memo) P.memo.set(name, res); return res;
}
function dealCands0(name, P){
  const A = art(name), nb = baseOf(name), alts = [];
  if(A.kw) A.kw.split(',').forEach(x => { const t = toks(x); if(t.length) alts.push({t, free:false, kw:true}); });
  else { const parts = / ou /.test(norm(name)) ? plain(name).split(/\s+ou\s+/i) : [name]; parts.forEach(p => { const r = reqToks(p); if(r.length) alts.push({t:r, free:false}); }); }
  (A.learn||[]).forEach(t => { if(t.length) alts.push({t, free:true}); });
  if(!alts.length) return [];
  const no = A.no ? A.no.split(',').flatMap(x => toks(x)) : [];
  const mine = new Set(toks(name).concat(alts.flatMap(a => a.t), pcToks(name)));
  if(/\bboites?\b|conserve|en d[ée]s/i.test(name)) ['conserve','endes','boite'].forEach(w => mine.add(w));
  const candyOk = CANDY_RE.test(norm(name)) || /chocolat|bonbon|friandise/.test(norm(name));
  let pool = P;
  if(P.idx){ const set = new Set(); alts.forEach(a => (P.idx.get(a.t[0]) || []).forEach(x => set.add(x))); pool = P.filter(x => set.has(x)); }
  const head = reqToks(name)[0], canned = CANNABLE.has(head) && (/\bboites?\b|conserve/.test(norm(name)) || /endes/.test(norm(rawFix(name)))) && !/\bboites? (de|d)( |')?(oeufs?|cereales?|biscuits?|craquelins?|the|cafe|mouchoirs?|chocolats?)/.test(norm(name)), ex = new Set(A.ex || []);
  return pool.filter(x => {
    if(no.some(w => x.tk.has(w)) || ex.has(norm(x.s.t))) return false;
    if(alts.some(a => a.free && a.t.every(w => x.tk.has(w)))) return true;
    if(x.candy && !candyOk) return false;
    if(canned ? !x.can : (CANNABLE.has(head) && x.canMark)) return false;
    if(COMPOUNDS.some(c => x.b.includes(c) && !nb.includes(c) && nb.split(' ').includes(c.split(' ')[0]))) return false;
    /* mots choisis à la main (Articles) : tous présents dans un même segment, sans autre contrôle de forme */
    return alts.some(a => !a.free && x.segs.some(W => a.kw ? a.t.every(w => W.includes(w)) : segFits(a.t, mine, W)));
  }).map(x => x.s);
}
const matchesFor = (name, list) => dealCands(name, prep(list));
/* moins cher dans une autre de tes épiceries ? */
function cheaper(r){
  if(_CMP.has(r.k)) return _CMP.get(r.k);
  let out = null;
  const A = storeOf(r), list = matchesFor(r.name, allSpec()).filter(s => isFinite(priceOf(s)));
  if(list.length){
    const atA = list.filter(s => s.s===A).map(s => dealCost(s, r)).filter(x => x != null);
    const costA = atA.length ? Math.min(...atA) : costEst(r);
    let best = null; list.filter(s => s.s!==A).forEach(s => { const c = dealCost(s, r); if(c != null && (!best || c < best.c)) best = {s, c}; });
    if(best && best.c < costA*0.9 && costA - best.c >= 0.5) out = {store:best.s.s, cost:best.c, costA, A, aDeal: atA.length>0, save: costA - best.c};
  }
  _CMP.set(r.k, out); return out;
}
/* vraies aubaines : rabais d'au moins 35 % sur un produit qui se garde ou se congèle */
function stockTip(n, ray){
  if(ray==='viandes' || ray==='poissonnerie') return 'À congeler en portions dans des sacs hermétiques : environ 3 mois pour la viande hachée et le poisson, 6 mois pour les pièces.';
  if(ray==='surgelés') return 'Se garde plusieurs mois au congélateur.';
  if(/beurre|fromage/.test(n)) return 'Le beurre et le fromage râpé se congèlent bien.';
  if(/garde-manger|épicerie/.test(ray) && !/pain|jus|lait|yogourt|creme|sushi|salade/.test(n)) return 'Se garde longtemps au garde-manger.';
  return '';
}
function aubaines(){
  const seen = new Set(), out = [];
  allSpec().forEach(s => {
    const pr = priceOf(s); if(!isFinite(pr)) return;
    const n = norm(s.t), ray = guessRayon(s.t), tip = stockTip(n, ray); if(!tip) return;
    let disc = s.d || 0;
    if(!disc && (ray==='viandes' || ray==='poissonnerie')){
      const hit = PRIX.find(([re]) => re.test(n)); const kg = hit && hit[1].kg;
      const sz = n.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|lb)\b/);
      const perKg = s.per==='lb' ? pr*2.2046 : s.per==='kg' ? pr : sz ? pr / (parseFloat(sz[1].replace(',','.')) * ({kg:1, g:0.001, lb:0.454})[sz[2]]) : null;
      if(kg && perKg) disc = Math.round((1 - perKg/kg)*100);
    }
    if(disc >= 35 && disc < 90 && !seen.has(n)){ seen.add(n); out.push({s, disc, tip}); }
  });
  return out.sort((a,b) => b.disc - a.disc).slice(0, 6);
}
function renderAubaines(){
  const L = aubaines(); if(!L.length) return '';
  const added = new Set((S.menu.sn||[]).map(x => x.t)), dis = '';
  return `<div class="card aub"><h3>Vraies aubaines : fais des réserves</h3><p class="small">Ces rabais sont rares : au moins 35 % sous le prix habituel. Bon moment pour en acheter plus et les garder.</p><div class="list">${L.map(x => `<div class="item"><span class="t"><span class="tags">${tagHtml(x.s)}<span class="flag w">−${x.disc} %</span></span><small>${esc(x.tip)}${goStores().includes(x.s.s) ? '' : ` Chez ${esc(x.s.s)}, où tu ne vas pas cette semaine.`}</small></span>${added.has(x.s.t) ? '<span class="small">Dans la liste</span>' : `<button class="btn s p" data-a="aubadd" data-t="${esc(x.s.t)}" ${dis}>En ajouter</button>`}</div>`).join('')}</div></div>`;
}

/* Historique : à chaque recherche, le meilleur spécial trouvé pour chaque article connu (8 dernières semaines). */
function noterPrix(){
  const d = shopISO(), L = (S.auto && S.auto.items || []).map(i => ({s:i.s, t:nice(i.t), p:i.p||'', d:i.d||0, per:i.per||''})).filter(s => isFinite(priceOf(s)));
  if(!L.length) return;
  const P = prep(L), arts = new Map(); S.ph = S.ph || {};
  const add = n => { if(n && !isMaison(n)) arts.set(artB(n), n); };
  if(S.menu.date) needs().forEach(n => add(n.name));
  Object.values(S.stock||{}).forEach(o => add(o.name)); (S.ess||[]).concat(S.snacks||[]).forEach(o => add(o.name));
  Object.keys(S.ph).forEach(b => { if(!arts.has(b)){ const c = catalog().find(x => x.b===b); if(c) arts.set(b, c.n); } });
  arts.forEach((name, b) => {
    const C = dealCands(name, P); if(!C.length) return;
    const s = C.reduce((a, x) => priceOf(x) < priceOf(a) ? x : a), pr = priceOf(s);
    const H = (S.ph[b] || []).filter(e => e.d !== d);
    const e = {d, s:s.s, p:pr, t:String(s.t).slice(0,48)}; if(s.d > 0 && s.d < 95) e.r = Math.round(pr/(1 - s.d/100)*100)/100;
    H.unshift(e); S.ph[b] = H.sort((x,y) => y.d.localeCompare(x.d)).slice(0, 6);
  });
}
const dShort = iso => { try{ return new Date(iso+'T12:00:00').toLocaleDateString('fr-CA', {day:'numeric', month:'short'}); }catch(e){ return iso; } };
/* « Souvent en spécial à … » pour un article sans spécial cette semaine */
function histLine(name){
  const H = ((S.ph||{})[artB(name)] || []).filter(e => e.d !== shopISO()); if(!H.length) return '';
  if(H.length===1){ const e = H[0]; return `Dernier spécial : ${money(e.p)} chez ${e.s} le ${dShort(e.d)} (${e.t}). Pas en spécial cette semaine.`; }
  const ps = H.map(e => e.p).sort((a,b) => a-b), lo = ps[0], hi = ps[ps.length-1];
  return `Souvent en spécial ${lo===hi ? 'à '+money(lo) : 'de '+money(lo)+' à '+money(hi)} (${H.length} fois depuis le ${dShort(H[H.length-1].d)}, dernier chez ${H[0].s}). Pas en spécial cette semaine.`;
}
/* le spécial d'un article cette semaine : celui choisi dans Articles, sinon le moins cher pour la quantité de la liste */
function dealFor(name){
  if(_DF.has(name)) return _DF.get(name);
  const man = (S.menu.dsel||{})[artB(name)]; let best = null;
  if(man !== 'none'){
    if(man) best = allSpec().find(s => spId(s)===man) || null;
    if(!best){
      const row = _BL ? _BL.rows.find(r => r.name===name) : null; let bc = Infinity;
      dealCands(name, prep(allSpec())).forEach(s => { const pr = priceOf(s), c = isFinite(pr) ? (row ? dealCost(s, row) : pr) : Infinity;
        if(!best || c < bc){ best = s; bc = c; } });
    }
  }
  _DF.set(name, best); return best;
}

/* ---------- génération du menu ---------- */
const protein = r => { const t = norm(r.n+' '+r.m.join(' ')); for(const p of ['poulet','boeuf','porc','saucisse','jambon','bacon','poisson','bologne']) if(t.includes(p)) return p; return 'autre'; };
const isPasta = r => /spaghetti|pates|lasagne|tortellini|mac n|gnocchi|carbonara|nouilles|ramen/.test(norm(r.n));
const uses = n => S.hist.reduce((c,w) => c + histItems(w).filter(x => x.r===n).length, 0);
function recentSet(){ return new Set(S.hist.slice(-S.p.cool).flatMap(w => histItems(w).map(x => x.r))); }
function pickVar(r){
  const nv = vars(r).length;
  if(S.p.varMode==='base' || !nv) return 0;
  const u = uses(r.n);
  return S.p.varMode==='var' ? 1 + (u % nv) : u % (nv+1);
}
/* un plat fait avec des restes ne profite pas du spécial de l'ingrédient qu'il récupère */
const itemDeals = (it, r) => { const ds = dealsOf(r); return r.ur && primOf(it) ? ds.filter(d => !urMatch(r.ur, d.mot) && !urMatch(r.ur, d.hit.t)) : ds; };
/* Coupe ou forme précise dans un spécial : elle doit aussi se trouver dans la recette (pas de boeuf haché pour un rôti). */
const SHAPES = ['hache','roti','steak','cotelette','cote','poitrine','cuisse','pilon','aile','epaule','longe','filet','saucisse','bacon','tranche','cube','laniere','surlonge','bavette','palette','croquette','pane','pizza','lasagne','tourtiere','pogo','burrito','soupe','sauce','croustille','biscuit','yogourt','glacee','gateau','muffin','barre','jus','boisson','vinaigrette','trempette','repas','salade','sandwich','fromage a la creme','poulet','boeuf','porc','dinde','jambon','saumon','crevette','veau','agneau','tilapia','morue','aiglefin','thon','poisson'];
const SHAPE_RE = SHAPES.map(w => [w, new RegExp('\\b'+w)]);
let _DO = new WeakMap();
function dealsOf(r){
  if(_DO.has(r)) return _DO.get(r); const res = dealsOf0(r); _DO.set(r, res); return res;
}
function dealsOf0(r){
  const out = [], ing = norm(r.n+' '+r.i.map(g => g[2]).join(' '));
  const fits = s => { const t = norm(s.t); return SHAPE_RE.every(([w,re]) => !re.test(t) || ing.includes(w)); };
  const P = prep(allSpec());
  for(const mot of (r.m||[])){ if(!toks(mot).length) continue; const hit = dealCands(mot, P).find(fits); if(hit && !out.some(y => y.hit===hit)) out.push({mot,hit}); }
  return out;
}
function score(r){
  let pts = 0;
  dealsOf(r).forEach(d => pts += GENERIC.includes(norm(d.mot)) ? .3 : 1.2);
  pts += .35 * [...r.e].filter(c => c!==' ' && c!=='️').length / 2;
  let hit = 0; effective(r,0).forEach(g => { if(isMaison(g.name)) return; const sk = skOf(g); if(sk) hit += Math.min(1, S.stock[sk].q/Math.max(normQU(g.name,g.q,g.u)[0],1)); });
  pts += Math.min(hit,5)*.4;
  if(S.fav[r.n]) pts += .8;
  if(tpOf(r)<=20) pts += .25;
  if(r.pp && dealsOf(r).length) pts += 2.5;
  if(r.rs && S.p.reste!==false && dealsOf(r).length) pts += .6;
  const rt = S.rate[r.n]; if(rt) pts += Math.max(-2, Math.min(1.5, .5*rt.up - .7*rt.down));
  return pts + Math.random()*.9;
}

function fillDej(n, keep, ban){
  const items = keep.slice(), taken = new Set(items.map(x => x.r)), banned = new Set([...recentSet(), ...taken, ...(ban||[])]);
  const base = allRecipes().filter(r => kindOf(r)==='dejeuner' && !S.dis[r.n] && !softBad(r) && ppOk(r) && !(ban && ban.has(r.n)));
  const best = semaine => { const ok = r => isSimple(r)===semaine && !taken.has(r.n);
    let c = base.filter(r => ok(r) && !banned.has(r.n)); if(!c.length) c = base.filter(ok); if(!c.length) c = base.filter(r => !taken.has(r.n));
    let b = null, bs = -1e9; c.forEach(r => { const s = score(r); if(s > bs){ bs = s; b = r; } }); return b; };
  const used = new Set(items.map(x => x.d).filter(Boolean)), free = dejDays().filter(d => !used.has(d));
  free.slice(0, Math.max(0, n - items.length)).forEach(d => { const r = best(!isOff(d)); if(!r) return; items.push({r:r.n, v:pickVar(r), d}); taken.add(r.n); });
  while(items.length < n){ const r = best(false); if(!r) break; items.push({r:r.n, v:pickVar(r)}); taken.add(r.n); }
  return items;
}
function fill(n, keep, l, ban){
  l = l || 'items'; const kind = ML[l];
  if(l==='dej') return fillDej(n, keep, ban);
  if(l==='din') return fillDin(n, keep, new Set([...(ban||[]), ...mlist('items').map(x => x.r)]));
  const items = keep.slice();
  const banned = new Set([...recentSet(), ...items.map(x => x.r), ...(ban||[])]);
  const pool = allRecipes().filter(r => kindOf(r)===kind && !S.dis[r.n] && !softBad(r) && ppOk(r) && simpleOk(r) && !(ban && ban.has(r.n)));
  let cands = pool.filter(r => !banned.has(r.n));
  /* pas assez de plats « frais » : on complète avec des plats récents, mais toujours après les nouveaux */
  if(cands.length < n - items.length) cands = pool.filter(r => !items.some(x => x.r===r.n));
  cands = cands.map(r => ({r, s:score(r) - (banned.has(r.n) ? 10 : 0)})).sort((a,b) => b.s-a.s);
  const taken = new Set(items.map(x => x.r));
  let pps = items.filter(x => (byName(x.r)||{}).pp).length;
  if(kind!=='souper'){
    for(const {r} of cands){ if(items.length>=n) break; if(taken.has(r.n) || (r.pp && pps>=1)) continue; items.push({r:r.n, v:pickVar(r)}); taken.add(r.n); if(r.pp) pps++; }
    return items;
  }
  const prot = {}, fams = {}, typs = {}; let pastas = 0, longs = 0, duos = items.filter(x => x.after).length; const maxLong = S.p.nLong ?? 1, maxDuo = n>=6 ? 2 : 1;
  const note = r => { const p = protein(r); prot[p] = (prot[p]||0)+1; pastas += isPasta(r)?1:0; longs += isLong(r)?1:0;
    const f = famOf(r); if(f) fams[f] = (fams[f]||0)+1; const ty = r.t||'viande'; typs[ty] = (typs[ty]||0)+1; };
  items.forEach(it => { const r = byName(it.r); if(r) note(r); });
  const push = (r, after) => { const it = mkItem(r, usedSides(items), pickVar(r)); if(after) it.after = after; items.push(it); taken.add(r.n); note(r); if(r.pp) pps++; };
  const pass = lvl => { for(const {r} of cands){
    if(items.length>=n) break; if(taken.has(r.n)) continue;
    if(r.pp && pps>=1) continue;
    const p = protein(r);
    if(lvl===0){ if(p!=='autre' && (prot[p]||0)>=2) continue; if(isPasta(r) && pastas>=2) continue; }
    if(lvl<2){ const f = famOf(r), ty = r.t||'viande'; if(f && fams[f]) continue; if(TY_MAX[ty]!==undefined && (typs[ty]||0) >= TY_MAX[ty]) continue; }
    if(lvl<2 && isLong(r) && longs>=maxLong) continue;
    if(lvl===0 && r.rs && duos>=maxDuo) continue;
    push(r);
    if(r.rs && S.p.reste!==false && duos<maxDuo && items.length < n){ const av = new Set(Object.keys(fams)), fu = pickFollow(r, new Set([...taken, ...banned]), av) || pickFollow(r, taken, av); if(fu){ push(fu, r.n); duos++; } }
  } };
  pass(0); if(items.length<n) pass(1); if(items.length<n) pass(2);
  return items;
}
function today(){ return fmtDate(shopISO()); }
function genMenu(){
  const m = S.menu, start = S.dates.shop || isoToday(), nm = {date:fmtDate(start), start, chk:{}, extra:{}, achete:false, snap:null, useup:m.useup||{}, sn:m.date ? (m.sn||[]) : [], dinCook:{}, dinNo:{}, dsel:m.dsel||{}};
  ['items','dej','ent','sou','des'].forEach(l => { nm[l] = fill(nOf(l), (m[l]||[]).filter(x => x.lock), l); });
  nm.din = (m.din||[]).filter(x => x.lock);
  S.menu = nm; assignDays(true); assignDej(true); syncDin(true); resetCaches();
  const nb = budgetFit(); if(nb) S.flash = `Budget : ${nb} souper${nb>1?'s':''} remplacé${nb>1?'s':''} par ${nb>1?'des plats moins chers':'un plat moins cher'}.`;
  save(); render();
}
/* coût approximatif d'un plat (au prorata, spéciaux compris) : sert seulement à comparer les plats entre eux */
function dishCost(it){
  let c = 0;
  fullIngs(it).forEach(g => { if(isMaison(g.name) || g.rest || g.x) return; let x = prixBase(g.name, g.u, g.rayon) * g.q; const d = dealFor(g.name);
    if(d){ const dc = dealCost(d, {name:g.name, u:g.u, buy:g.q, rayon:g.rayon, k:g.k}); if(dc != null && isFinite(dc)) x = Math.min(x, dc); }
    if(isFinite(x)) c += x; });
  return c;
}
/* Budget : tant que la liste dépasse, le souper le plus cher (non verrouillé) est remplacé par un plat bien noté
   qui coûte au moins 20 % de moins. Au plus 6 remplacements; renvoie le nombre de plats changés. */
function budgetFit(){
  const b = +S.p.budget || 0; if(!b || !S.menu.date || S.menu.achete) return 0;
  let changed = 0; const recent = recentSet(), tried = new Set();
  /* candidats évalués une seule fois (note et coût), pas à chaque tour */
  const pool = allRecipes().filter(r => kindOf(r)==='souper' && !S.dis[r.n] && !softBad(r) && ppOk(r) && simpleOk(r) && !recent.has(r.n))
    .map(r => { const it = mkItem(r, new Set(), pickVar(r)); return {r, s: score(r), c: dishCost(it)}; });
  for(let k = 0; k < 6; k++){
    resetCaches();
    if(listTotals(buyList().rows).cost <= b) break;
    const L = mlist('items'), used = new Set(allItems().map(x => x.r));
    const cand = L.map((it, i) => ({it, i, c: dishCost(it)})).filter(o => !o.it.lock && !o.it.dfix && !o.it.after && !follOf(o.it) && !tried.has(o.it.r) && byName(o.it.r)).sort((a, c) => c.c - a.c)[0];
    if(!cand) break;
    tried.add(cand.it.r);
    const longOk = isLong(byName(cand.it.r));
    const others = L.filter((_, j) => j !== cand.i);
    let best = null;
    pool.forEach(o => { if(used.has(o.r.n) || (isLong(o.r) && !longOk) || !(o.c < cand.c * 0.8)) return;
      const s = o.s - 2 * o.c / Math.max(1, cand.c); if(!best || s > best.s) best = {r:o.r, s}; });
    if(!best) continue;
    const it = mkItem(best.r, usedSides(others), pickVar(best.r)); if(cand.it.d) it.d = cand.it.d;
    L[cand.i] = it; changed++;
  }
  resetCaches(); return changed;
}
function ajuster(){
  const m = S.menu; if(!m.date) return;
  ['items','dej','ent','sou','des'].forEach(l => {
    const n = nOf(l), cur = mlist(l);
    if(cur.length > n){ const locked = cur.filter(x => x.lock), rest = cur.filter(x => !x.lock).slice(0, Math.max(0, n-locked.length)); m[l] = cur.filter(x => x.lock || rest.includes(x)); }
    else if(cur.length < n) m[l] = fill(n, cur, l);
  });
  assignDays(false); assignDej(false); syncDin(false);
}


/* ---------- recherche des spéciaux (Flipp) ---------- */
const FLIPP = 'https://backflipp.wishabi.com/flipp';
/* Épiceries du Québec, regroupées. Le nom affiché est reconnu dans le nom du marchand des circulaires. */
const STORE_GROUPS = [
  ['Supermarchés', [['IGA',/\biga\b/],['Metro',/\bmetro\b/],['Provigo',/provigo/],['Inter-Marché',/inter-?\s?march/],['Marché Ami',/marche ami\b/],['Marché Richelieu',/richelieu/],['Marchés Tradition',/tradition/],['Bonichoix',/bonichoix/],['Axep',/axep/]]],
  ['À escompte', [['Maxi',/\bmaxi\b/],['Super C',/super ?c\b/],['Tigre Géant',/tigre geant|giant tiger/]]],
  ['Grandes surfaces et entrepôts', [['Walmart',/walmart/],['Costco',/costco/],['Mayrand',/mayrand/]]],
  ['Santé, vrac et spécialités', [['Adonis',/adonis/],['Avril',/\bavril\b/],['Rachelle-Béry',/rachelle.?bery/],['Bulk Barn',/bulk barn/]]],
  ['Pharmacies (quelques aliments en spécial)', [['Jean Coutu',/jean coutu/],['Familiprix',/familiprix/],['Pharmaprix',/pharmaprix|shoppers/],['Uniprix',/uniprix/],['Brunet',/\bbrunet\b/]]]
];
const MARCHANDS = STORE_GROUPS.flatMap(g => g[1].map(([n,re]) => [re,n]));
const STORES = MARCHANDS.map(x => x[1]);
const allStores = () => STORES.concat((S.storesx||[]).filter(s => !STORES.includes(s)));
const marchand = n => { const t = norm(n||'').trim(); if(!t) return ''; const m = MARCHANDS.find(x => x[0].test(t)); if(m) return m[1];
  return (S.storesx||[]).find(s => { const c = norm(s).trim(); return c.length>2 && (t.includes(c) || c.includes(t)); }) || ''; };
const GROCERY_CAT = f => { const c = norm([].concat(f.categories||[]).join(' ')+' '+(f.categories_csv||'')); return !c.trim() || (/grocer|epicer|aliment|food|pharm/.test(c) && !/restaurant/.test(c)); };
let stFound = null;
async function trouverEpiceries(){
  const msg = $('#st_msg'), cp = (S.cp||'').replace(/\s/g,'').toUpperCase();
  if(!cp){ say(msg, "Entre d'abord ton code postal."); return; }
  if(!cpOk(cp)){ say(msg, 'Code postal invalide (exemple : G6V 6Z3).'); return; }
  say(msg, 'Recherche des épiceries près de chez toi…');
  try{
    const fl = flyersOf(await jget(`${FLIPP}/flyers?locale=fr-ca&postal_code=${encodeURIComponent(cp)}`));
    const names = new Map();
    fl.forEach(f => {
      const c = norm([].concat(f.categories||[]).join(' ')+' '+(f.categories_csv||''));
      if(!/grocer|epicer|aliment|food/.test(c) || /restaurant/.test(c)) return;
      const raw = String(f.merchant||'').trim(); if(!raw) return;
      const k = marchand(raw) || raw; if(!names.has(k)) names.set(k, !!marchand(raw));
    });
    stFound = [...names.entries()].map(([n,known]) => ({n, known})).sort((a,b) => a.n.localeCompare(b.n,'fr'));
    render();
    say($('#st_msg'), stFound.length ? `${stFound.length} épicerie${stFound.length>1?'s':''} trouvée${stFound.length>1?'s':''} avec une circulaire pour ${cp}. Coche celles où tu vas.` : `Aucune circulaire d'épicerie trouvée pour ${cp}. Vérifie le code postal.`);
  }catch(e){ say($('#st_msg') || msg, e.net ? "La recherche est bloquée par le navigateur ou tu es hors ligne. Coche tes épiceries dans la liste, ou ajoute celles qui manquent à la main." : 'La recherche a échoué ('+(e.message||'erreur')+'). Coche tes épiceries dans la liste.'); }
}
const storeChip = n => `<label class="chip"><input type="checkbox" data-store="${esc(n)}" ${S.stores.includes(n)?'checked':''}>${esc(n)}</label>`;
function storePicker(){
  const own = (S.storesx||[]).filter(s => !STORES.includes(s));
  return `<div class="acts"><button class="btn s" id="st_find">Trouver les épiceries de mon code postal</button></div><div class="note" id="st_msg" hidden></div>
    ${stFound && stFound.length ? `<p class="sgrp">Près de chez toi</p><div class="chips">${stFound.map(x => storeChip(x.n)).join('')}</div>` : ''}
    ${STORE_GROUPS.map(([g, L]) => `<p class="sgrp">${esc(g)}</p><div class="chips">${L.map(([n]) => storeChip(n)).join('')}</div>`).join('')}
    <p class="sgrp">Autres épiceries de ta région</p>
    ${own.length ? `<div class="chips">${own.map(storeChip).join('')}</div><p class="small">Retirer : ${own.map(s => `<a href="#" data-a="stx_rm" data-s="${esc(s)}">${esc(s)}</a>`).join(', ')}</p>` : ''}
    <div class="grid2" style="grid-template-columns:1fr auto;align-items:end"><label class="f">Une épicerie manque ?<input type="text" id="stx_n" placeholder="Nom de l'épicerie" autocomplete="off"></label><button class="btn s" id="stx_add">Ajouter</button></div>`;
}
/* requête vers les circulaires : délai maximal, erreurs réseau étiquetées, réponse vérifiée */
async function jget(u, ms){
  const relay = /^https:\/\//.test(S.relay||'') ? S.relay : '';
  const url = relay ? relay + encodeURIComponent(u) : u;
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), ms || 15000);
  let r;
  try{ r = await fetch(url, {signal: ac.signal}); }
  catch(e){ throw Object.assign(new Error(e.name==='AbortError' ? 'délai dépassé' : 'réseau'), {net:true}); }
  finally{ clearTimeout(to); }
  if(!r.ok) throw Object.assign(new Error('HTTP '+r.status), {net:true});
  let d; try{ d = await r.json(); }catch(e){ throw new Error('réponse illisible'); }
  if(d && typeof d.contents==='string'){ try{ d = JSON.parse(d.contents); }catch(e){} }   /* relais de type allorigins */
  return d;
}
const flyersOf = fl => { const a = Array.isArray(fl) ? fl : fl && Array.isArray(fl.flyers) ? fl.flyers : null; if(!a) throw new Error('format des circulaires inattendu'); return a; };
const itemsOf = d => { const a = Array.isArray(d) ? d : d && Array.isArray(d.items) ? d.items : null; if(!a) throw new Error('format'); return a; };
/* jour local (Québec) d'une date de circulaire : « 2026-10-21T23:59:59-04:00 » → 2026-10-21 */
const dayOf = v => { if(!v) return ''; const s = String(v); if(/^\d{4}-\d\d-\d\d$/.test(s)) return s; const d = new Date(s); return isNaN(d) ? s.slice(0,10) : d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const covers = (f, day) => (!f.valid_from || dayOf(f.valid_from) <= day) && (!f.valid_to || dayOf(f.valid_to) >= day);
const cpOk = cp => /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cp);
let spBusy = false;
function motsCles(){
  const set = new Set();
  allRecipes().forEach(r => r.m.forEach(m => { const n = norm(m); if(n.length>=4 && !GENERIC.includes(n)) set.add(n); }));
  ['lait','oeuf','pain','cereale','jus','croustille','gazeuse','yogourt','beurre','fromage','pates','pizza','bacon','banane','pomme','clementine','biscuit','cafe','jambon','creme','farine','riz','raisin','carotte','concombre','tomate','oignon','laitue','poulet','boeuf','porc','saucisse','frite','poisson','saumon','tortilla','sauce'].concat(SNACK_WORDS).forEach(x => set.add(norm(x)));
  return [...set];
}
async function chercherSpeciaux(ignorerDate){
  /* le bouton et le message sont relus à chaque étape : l'écran peut être redessiné pendant la recherche */
  const say = t => { const st = $('#sp_status'); if(st) st.textContent = t; };
  if(spBusy) return;
  const cp = (S.cp||'').replace(/\s/g,'').toUpperCase();
  if(!S.stores.length){ say('Choisis d\'abord tes épiceries dans Réglages.'); return; }
  if(!cp){ say('Entre d\'abord ton code postal dans Réglages.'); return; }
  if(!cpOk(cp)){ say('Code postal invalide dans Réglages (exemple : G6V 6Z3).'); return; }
  spBusy = true; { const b = $('#sp_go'); if(b) b.disabled = true; }
  const shop = shopISO();
  try{
    say('Recherche des circulaires…');
    const all = flyersOf(await jget(`${FLIPP}/flyers?locale=fr-ca&postal_code=${encodeURIComponent(cp)}`)).filter(f => { const s = marchand(f.merchant); return s && S.stores.includes(s); });
    if(!all.length){ say("Aucune circulaire de tes épiceries trouvée pour ce code postal."); return; }
    let flyers = all.filter(f => covers(f, shop));
    let note = '', anyDate = false;
    if(!flyers.length){
      if(!ignorerDate){
        const later = all.filter(f => dayOf(f.valid_from) > shop).map(f => dayOf(f.valid_from)).sort()[0];
        const fin = all.map(f => dayOf(f.valid_to)).sort().pop();
        say(later ? `Les circulaires qui couvrent le ${fmtDate(shop)} commencent le ${fmtDate(later)} : relance la recherche à ce moment. `
          : `Aucune circulaire ne couvre le ${fmtDate(shop)} pour l'instant (les circulaires actuelles finissent le ${fmtDate(fin)}). Les nouvelles sortent le jeudi : relance la recherche plus tard. `);
        const st = $('#sp_status');
        if(st){ const a = document.createElement('button'); a.className = 'btn s'; a.textContent = 'Utiliser les circulaires actuelles quand même'; a.onclick = () => chercherSpeciaux(true); st.appendChild(a); }
        return;
      }
      flyers = all.filter(f => covers(f, isoToday()));
      if(!flyers.length) flyers = all;
      note = ' (circulaires actuelles, possiblement expirées à la date de l\'épicerie)'; anyDate = true;
    }
    const isGro = f => /grocer|epicer/.test(norm(String(f.categories_csv||f.categories||'')));
    flyers = flyers.filter(GROCERY_CAT).sort((a,b) => (isGro(b)?1:0) - (isGro(a)?1:0));
    /* au moins une circulaire par épicerie choisie, puis les autres, jusqu'à 24 */
    { const seen = new Set(), first = flyers.filter(f => { const s = marchand(f.merchant); if(seen.has(s)) return false; seen.add(s); return true; });
      flyers = first.concat(flyers.filter(f => !first.includes(f))).slice(0, 24); }
    const mots = motsCles(); const items = []; let ok = 0, fail = 0;
    for(let k = 0; k < flyers.length; k++){
      const f = flyers[k]; say(`Lecture de la circulaire ${k+1} / ${flyers.length} : ${marchand(f.merchant)}…`);
      try{
        itemsOf(await jget(`${FLIPP}/flyers/${f.id}?locale=fr-ca&postal_code=${encodeURIComponent(cp)}`)).forEach(it => {
          const nn = norm(it.name||''); if(!nn || !mots.some(w => nn.includes(w)) || !isFood(nn)) return;
          const pr = parseFloat(String(it.price ?? it.current_price ?? '').replace(',', '.'));
          /* produits vendus au poids (Maxi, Provigo… : code « _KG ») : le prix affiché est à la livre */
          const per = /_KG$/i.test(String(it.print_id || it.sku || '')) ? 'lb' : /\/\s*kg\b/i.test(String(it.price_text||'')) ? 'kg' : /\/\s*lb\b/i.test(String(it.price_text||'')) ? 'lb' : '';
          const d = +it.discount;
          items.push({s:marchand(f.merchant), t:String(it.name).slice(0, 200), p:isFinite(pr)&&pr>0 ? pr.toFixed(2).replace('.',',')+' $' : '', per, vf:dayOf(it.valid_from||f.valid_from), vt:dayOf(it.valid_to||f.valid_to), d: d > 0 && d < 95 ? Math.round(d) : 0});
        });
        ok++;
      }catch(e){ fail++; if(e.net && fail >= 3 && !ok){ throw e; } }
    }
    const uniq = new Map(); items.forEach(i => uniq.set(i.s+'|'+norm(i.t), i));
    const list = [...uniq.values()].sort((a,b) => (b.d||0)-(a.d||0)).slice(0,600);
    /* rien de lisible : on garde les spéciaux déjà trouvés plutôt que de les effacer */
    if(!ok || !list.length){ say((S.auto && S.auto.items.length ? 'Aucun spécial lisible cette fois-ci : les spéciaux trouvés avant sont gardés. ' : 'Les circulaires ont été trouvées, mais leur contenu est illisible. ') + 'Réessaie plus tard ou utilise le collage manuel ci-dessous.'); return; }
    S.auto = {items:list, maj:isoToday(), shop, anyDate, src:[...new Set(flyers.map(f => marchand(f.merchant)))].join(', ')};
    try{ noterPrix(); }catch(e){}
    spBusy = false; save(); render();
    say(`${list.length} spéciaux retenus dans ${ok} circulaire${ok>1?'s':''} (${S.auto.src}) pour le ${fmtDate(shop)}${note}.` + (fail ? ` ${fail} circulaire${fail>1?'s':''} illisible${fail>1?'s':''} : relance plus tard pour les avoir.` : '') + ((S.skip||[]).some(s => S.stores.includes(s)) ? ` Cette semaine : ${autoItems().length} chez ${goStores().join(', ') || 'aucune épicerie'}.` : ''));
  }catch(e){
    say(e.net
      ? "Le navigateur a bloqué la requête vers Flipp, la connexion est trop lente ou tu es hors ligne. Réessaie, ou ouvre « Si la recherche ne fonctionne pas » : colle le texte d'une circulaire, ou ajoute un relais."
      : 'La recherche a échoué ('+(e.message||'erreur')+'). Réessaie plus tard ou colle le texte de la circulaire.');
  }finally{
    spBusy = false; const b = $('#sp_go'); if(b) b.disabled = false;
  }
}

/* ---------- copier pour envoyer ---------- */
/* renvoie true seulement si le texte est vraiment dans le presse-papiers */
async function copier(text, msgId){
  try{ await navigator.clipboard.writeText(text); const msg = $(msgId); if(msg) msg.textContent = 'Copié. Colle-le dans un message.'; return true; }
  catch(e){
    const msg = $(msgId); if(!msg) return false;
    msg.innerHTML = 'Copie bloquée : sélectionne le texte ci-dessous.<textarea readonly id="exout" style="margin-top:6px;min-height:160px"></textarea>';
    const ta = $('#exout'); ta.value = text; ta.focus(); ta.select(); return false;
  }
}
function exportCard(idp){
  return `<div class="card"><h3>Copier pour envoyer</h3><p class="small">Rien n'est synchronisé entre les téléphones. Touche Copier, puis colle le texte dans un message ou dans Notes.</p>
    ${[['l',"Liste d'épicerie seulement"],['m','Menu de la semaine (plats et accompagnements)'],['d','Menu détaillé (ingrédients et préparation)']].map(([c,l]) => `<div class="item"><span class="t"><b>${l}</b></span><div class="acts"><button class="btn s p" id="${idp}${c}_copy">Copier</button></div></div>`).join('')}
    <div class="small" id="${idp}msg"></div></div>`;
}

/* ---------- rendu : menu ---------- */
function avecTxt(it){
  const lbl = q => ({0:'aucun',0.5:'moins',1.5:'plus',2:'double'})[q]||'';
  const sf = sideById(it.sf), sv = sideById(it.sv);
  return [(it.fm??1)>0 && sf && sf.n + ((it.fm??1)===1?'':' ('+lbl(it.fm)+')'), (it.vm??1)>0 && sv && sv.n + ((it.vm??1)===1?'':' ('+lbl(it.vm)+')')].filter(Boolean).join(' + ');
}
/* Portions d'un plat : souper + restes par défaut; 2 pour un souper en amoureux, plus quand on reçoit. */
function portionSel(it, i, l){
  const def = ptDef(it, l), cur = it.pt || def, habit = ['items','din','dej'].includes(l);
  const opts = [1,2,3,4,5,6,7,8,9,10,12,14,16,20,24].concat([cur]).filter((v,j,a) => a.indexOf(v)===j).sort((a,b) => a-b);
  return `<label class="inl"><select class="day" data-a="portions" data-ml="${l}" data-i="${i}" aria-label="Portions">${opts.map(v => `<option value="${v===def && !it.pt ? 0 : v}" ${v===cur?'selected':''}>${v} portion${v>1?'s':''}${v===def ? (habit ? ' (habituel)' : ' (recette)') : v===2 ? ' (à deux)' : ''}</option>`).join('')}</select></label>`;
}
const dcolHtml = d => { const dt = d ? new Date(d+'T12:00:00') : null;
  return dt ? `<span class="dcol${isOff(d)?' off':''}${d===isoToday()?' now':''}"><small>${esc(dt.toLocaleDateString('fr-CA',{weekday:'short'}))}</small><b>${dt.getDate()}</b></span>` : `<span class="dcol"><small>jour</small><b>?</b></span>`; };
/* jour de dîner sans plat : les restes de la veille, ou rien de prévu */
function restRow(p){
  if(p.rest) return `<div class="restd"><div class="dsum">${dcolHtml(p.d)}<span class="dmain"><span class="dline"><span class="dname">Restes : ${esc(p.rest.r)}</span></span><span class="dsub">du souper de ${esc(dayLbl(p.rest.d).toLowerCase())}, rien à acheter</span>${S.menu.achete ? '' : `<button class="lnk" data-a="dincook" data-d="${p.d}">Préparer un dîner à la place</button>`}</span></div></div>`;
  return `<div class="restd"><div class="dsum">${dcolHtml(p.d)}<span class="dmain"><span class="dline"><span class="dname">Dîner à prévoir</span></span><span class="dsub">pas de restes la veille : un lunch avec ce qu'il y a à la maison, ou ajoute un plat</span><button class="lnk" data-a="din_add" data-d="${p.d}">Ajouter un plat ce midi-là</button></span></div></div>`;
}
function carte(it, i, l){
  const m = S.menu, r = byName(it.r); if(!r) return '';
  const dis = '', souper = l==='items', meal = l==='items' || l==='din', dated = meal || l==='dej';
  const B = (a, label, cls, always) => `<button class="btn s ${cls||''}" data-a="${a}" data-ml="${l}" data-i="${i}" ${always?'':dis}>${label}</button>`;
  const vs = vars(r), cur = it.v>0 ? vs[it.v-1] : null;
  const deals = itemDeals(it, r), sto = stockOf(it);
  const ing = fullIngs(it,true).sort((a,b) => a.name.localeCompare(b.name,'fr'));
  const avec = meal ? avecTxt(it) : '';
  const fo = souper ? follOf(it) : null, pr = souper && r.ur ? primOf(it) : null;
  const showRate = dated ? (it.d && it.d <= isoToday()) : m.achete;
  const pk = `dish|${l}|${i}`, open = openPan.has(pk);
  const dcol = dated ? dcolHtml(it.d) : '';
  const restA = l==='din' ? restesAvail(it.d) : null;
  const flags = [it.rep ? ['Reporté','k'] : null, it.pt && it.pt!==ptDef(it, l) ? [`${it.pt} portion${it.pt>1?'s':''}`,'a'] : null, it.lock ? ['Gardé','a'] : null, cur ? [vname(cur[0]),''] : null, fo ? ['Donne des restes','k'] : null, pr ? ['Avec les restes','k'] : null,
    r.pp ? ['Prêt à servir',''] : null, souper && mjOf(r) && it.d && !isOff(it.d) && (mjOf(r)===1 || tmOf(r) > MAX_FOUR) ? ['Mijoteuse','k'] : null, it.rt==='up' ? ['Aimé','a'] : it.rt==='down' ? ['Pas aimé','w'] : null, sto.length ? ['Déjà à la maison','a'] : null].filter(Boolean);
  return `<details class="dish${it.lock?' locked':''}" data-pan="${pk}" ${open?'open':''}><summary>${dcol}
    <span class="dmain"><span class="dline"><span class="dname">${esc(r.n)}</span><span class="lead" aria-hidden="true"></span><span class="dtime">${tmShort(r)}</span></span>
      <span class="dsr">${(meal && avec) || it.sc ? `<span class="dsub">${esc([meal && avec ? 'avec '+avec.split(' + ').map(lowFirst).join(' et ') : '', it.sc ? lowFirst(it.sc.replace(/\s*\(.*\)$/,'')) : ''].filter(Boolean).join(', '))}</span>` : ''}<button class="cookb" data-a="cook" data-ml="${l}" data-i="${i}">Recette</button></span>
      ${flags.length ? `<span class="flags">${flags.map(([t,c]) => `<span class="flag ${c}">${esc(t)}</span>`).join('')}</span>` : ''}
      ${deals.length?`<span class="tags">${deals.map(d => tagHtml(d.hit)).join('')}</span>`:''}</span></summary>
    <div class="dbody">
    <div class="drow">${dated ? `<span class="dayw">${daySelect(it,i,l)}</span>` : ''}${portionSel(it, i, l)}</div>
    ${metaTags(r, souper)}
    ${tmOf(r) > tpOf(r) + 5 ? `<p class="small">${esc(tmTxt(r))}</p>` : ''}
    ${souper && mjTxt(it, r) ? `<p class="rest">${esc(mjTxt(it, r))}</p>` : ''}
    ${fo ? `<p class="rest">Restes prévus pour ${esc(fo.r)}${fo.d ? ' ('+esc(dayLbl(fo.d).toLowerCase())+')' : ''}. Achète un peu plus et garde le reste.</p>` : ''}
    ${pr ? `<p class="rest">Avec les restes de ${esc(pr.r)}. Pas besoin d'en racheter.</p>` : ''}
    ${sto.length?`<p class="stock">À la maison : ${esc(sto.join(', '))}</p>`:''}
    ${vs.length?`<div class="seg" role="group" aria-label="Version">${['Normale'].concat(vs.map(x=>vname(x[0]))).map((nm,j)=>`<button class="${j===it.v?'on':''}" data-a="msetv" data-ml="${l}" data-i="${i}" data-v="${j}" ${dis}>${esc(nm)}</button>`).join('')}</div>`:''}
    ${cur ? varDetail(cur) : ''}
    ${meal ? `<details class="panel"><summary>Accompagnements</summary>${sideBlock(it,i,l)}<div class="acts">${B('mreroll','Autres accompagnements')}</div></details>` : ''}
    ${meal ? `<label class="f">Sauce en complément (facultatif)<select data-a="msauce" data-ml="${l}" data-i="${i}" ${dis}><option value="">Aucune</option>${allRecipes().filter(x => kindOf(x)==='sauce').sort((a,b) => a.n.localeCompare(b.n,'fr')).map(x => `<option ${it.sc===x.n?'selected':''}>${esc(x.n)}</option>`).join('')}</select></label>` : ''}
    <details class="panel"><summary>Recette et ingrédients</summary>
      <ul class="ing">${ing.map(g=>`<li class="${g.x?'x':''}"><span>${esc(g.name)}</span><span>${fq(g.q,g.u)}${g.rest ? '<em class="restq">restes</em>' : `<a href="#" data-a="mexing" data-ml="${l}" data-i="${i}" data-k="${esc(g.k)}" aria-label="${g.x?'Remettre':'Retirer'} ${esc(g.name)}">${g.x?'remettre':'retirer'}</a>`}</span></li>`).join('')}</ul>
      <p class="small">« Retirer » enlève l'ingrédient de la liste d'épicerie.</p>
      <p class="steps">${esc(r.s)}</p>${cur && cur[2] ? `<p class="steps"><b>Pour cette version :</b> ${esc(cur[2])}</p>` : ''}
    </details>
    ${showRate ? `<div class="rate"><span class="small">Après le repas</span>${B('mup', it.rt==='up'?'On a aimé ✓':'On a aimé', it.rt==='up'?'p':'', true)}${B('mdown', it.rt==='down'?'Pas aimé ✓':'Pas aimé', it.rt==='down'?'p':'', true)}</div>` : ''}
    <div class="acts">${B('mlock', it.lock?'Gardé ✓':'Garder', it.lock?'p':'')}${B('mswap','Autre plat')}
      ${souper ? `<details class="more"><summary>Reporter</summary><div class="more-p"><p class="small" style="flex-basis:100%">Resto ou changement de plan ? Le plat garde ses ingrédients.</p>${B('rep1','À demain','',true)}${B('repw','À la semaine prochaine','',true)}</div></details>` : ''}
      ${restA ? B('dinrest', `Manger plutôt les restes de ${esc(restA.r)}`) : ''}
      <details class="more"><summary>Plus</summary><div class="more-p">${B('mcopy','Copier la recette','',true)}${B('mdis',"Je n'aime pas")}${l==='din' ? B('dinno','Pas de dîner ce jour-là','d') : B('mrm','Retirer du menu','d')}</div></details></div>
    <div class="small" id="rmsg_${l}_${i}"></div></div></details>`;
}
function countSelects(dis){
  return [['nDej','Déjeuners',[0,1,2,3,4,5,6,7]],['nDin','Dîners',[0,1,2,3,4,5,6,7]],['n','Soupers',[3,4,5,6,7]],['nEnt','Entrées',[0,1,2,3,4,5,6,7]],['nSou','Soupes',[0,1,2,3]],['nDes','Desserts',[0,1,2,3,4,5,6,7]]].map(([k,lab,opts]) => `<label class="f">${lab}<select data-p="${k}" ${dis||''}>${opts.map(v=>`<option ${(S.p[k]||0)===v?'selected':''}>${v}</option>`).join('')}</select></label>`).join('');
}
function renderSetup(){
  const p = S.p;
  return `<div class="card call"><h3>Bienvenue ! On prépare ton application</h3>
    <p class="small">Elle démarre vide. Choisis tes épiceries, ton code postal et ce que tu veux planifier chaque semaine. Tout se change plus tard dans Réglages.</p>
    <label class="f">Code postal<input type="text" data-cp="1" value="${esc(S.cp)}" autocapitalize="characters" placeholder="A1A 1A1"></label>
    <p class="small"><b>Mes épiceries</b>, pour chercher les spéciaux. Coche celles où tu vas, ou touche le bouton pour voir celles qui ont une circulaire près de chez toi.</p>
    ${storePicker()}
    <div class="grid2">${countSelects()}</div>
    <div class="grid2"><label class="f">Portions au souper<select data-p="souper">${[2,3,4,5,6,7,8].map(n=>`<option ${p.souper===n?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="f">Restes pour le dîner<select data-p="restes">${[0,1,2,3,4,5].map(n=>`<option ${p.restes===n?'selected':''}>${n}</option>`).join('')}</select></label></div>
    <label class="check"><input type="checkbox" id="su_ess"> Ajouter une liste de départ pour les déjeuners, lunchs, collations et boissons</label>
    <button class="btn p" id="setup_done">Commencer</button></div>`;
}
/* Où on fait l'épicerie cette semaine : toutes, une seule (commande en ligne) ou quelques-unes. */
function storeWeek(m){
  const go = goStores(), all = go.length===S.stores.length, one = go.length===1 && !S.goSome ? go[0] : '';
  const mode = S.goSome ? '+' : all ? '*' : one || '+', dis = '';
  return `<label class="f">Cette semaine, je fais l'épicerie<select data-a="gomode" ${dis}><option value="*" ${mode==='*'?'selected':''}>Dans toutes mes épiceries (${S.stores.length})</option>${S.stores.map(s => `<option value="${esc(s)}" ${mode===s?'selected':''}>Seulement chez ${esc(s)}</option>`).join('')}<option value="+" ${mode==='+'?'selected':''}>Dans quelques-unes…</option></select></label>
    ${mode==='+' ? `<div class="chips">${S.stores.map(s => `<label class="chip"><input type="checkbox" data-go="${esc(s)}" ${go.includes(s)?'checked':''} ${dis}>${esc(s)}</label>`).join('')}</div>` : ''}
    ${go.length===1 ? `<p class="small">Tout vient de ${esc(go[0])} : les plats choisis selon ses spéciaux, la liste, les prix et les aubaines. Pratique pour une commande en ligne.</p>` : ''}`;
}
function renderWeek(){
  const m = S.menu, items = autoItems(), shop = shopISO(), stores = S.stores.length ? S.stores : allStores();
  const go = goStores();
  const status = S.stores.length && !go.length ? 'Coche au moins une épicerie pour voir ses spéciaux.'
    : S.auto ? `${items.length} spécia${items.length>1?'ux':'l'} valide${items.length>1?'s':''} ce jour-là, dans ${esc(go.join(', ') || S.auto.src || 'les circulaires')}.`
    : S.stores.length ? 'Les spéciaux de tes épiceries ne sont pas encore cherchés.' : 'Choisis tes épiceries dans Réglages pour chercher les spéciaux.';
  return `<div class="card week">
    <h2>Épicerie du ${esc(fmtDate(shop))}</h2>
    <div class="grid4c">${countSelects('')}</div>
    <p class="small">Chaque souper donne ${totalPortions()} portions : ${S.p.souper} au souper et ${S.p.restes} pour le dîner du lendemain.${S.p.nDin && S.p.restes > 0 && S.p.dinRestes!==false ? ' Les dîners mangent d\'abord ces restes.' : ''}</p>
    ${S.stores.length > 1 ? storeWeek(m) : ''}
    <div class="acts"><button class="btn" id="sp_go" ${spBusy ? 'disabled' : ''}>${spBusy ? 'Recherche en cours…' : 'Chercher les spéciaux'}</button>${m.date ? '<button class="btn" id="gen" data-armed="0">Refaire le menu</button>' : '<button class="btn p" id="gen">Créer le menu</button>'}</div>
    <p class="small" id="sp_status">${status}</p>
    ${items.length?`<details class="panel"><summary>Voir les spéciaux <span class="rm">${items.length}</span></summary><div class="list">${items.slice(0,150).map(i=>`<div class="item"><span class="t">${tagHtml({t:nice(i.t), p:i.p||'', s:i.s})}${i.vt?`<small>Jusqu'au ${esc(fmtDate(i.vt))}</small>`:''}</span></div>`).join('')}</div></details>`:''}
    <details class="panel"><summary>Changer les dates</summary>
      <div class="grid2"><label class="f">Je planifie le<input type="date" id="d_plan" value="${esc(S.dates.plan||isoToday())}"></label><label class="f">J'achète le<input type="date" id="d_shop" value="${esc(shop)}"></label></div>
      <p class="small">Les spéciaux retenus sont ceux valides le jour de l'épicerie. Les nouvelles circulaires sortent le jeudi : si elles ne sont pas encore là, relance la recherche plus tard.</p>
    </details>
    <details class="panel"><summary>Si la recherche ne fonctionne pas</summary>
      <label class="f">Code postal<input type="text" data-cp="1" value="${esc(S.cp)}" autocapitalize="characters" placeholder="A1A 1A1"></label>
      <p class="small">Certains navigateurs bloquent la recherche. Copie alors le texte d'une circulaire sur <a href="https://flipp.com/fr-ca" target="_blank" rel="noopener">Flipp</a> et colle-le ici.</p>
      <label class="f">Magasin<select id="spstore">${stores.map(s=>`<option>${esc(s)}</option>`).join('')}</select></label>
      <textarea id="sptxt" placeholder="Poitrines de poulet 4,99 $&#10;Boeuf haché mi-maigre 3,95 $" aria-label="Texte de la circulaire"></textarea>
      <div class="acts"><button class="btn s p" id="spadd">Ajouter ces spéciaux</button>${S.spec.length?'<button class="btn s d" id="spclr">Vider les ajouts</button>':''}</div>
      <div id="spmsg" class="small"></div>
      ${S.spec.length?`<div class="chips">${S.spec.slice(0,60).map((s,i)=>`<span class="chip">${esc(s.t.slice(0,60))} · ${esc(s.s)} <a href="#" data-a="spdel" data-i="${i}" aria-label="Retirer">×</a></span>`).join('')}</div>`:''}
      <label class="f">Relais (facultatif, pour utilisateurs avancés)<input type="text" id="relay_in" value="${esc(S.relay)}" placeholder="https://…?url="></label>
    </details>
  </div>`;
}
function daySelect(it,i,l){
  l = l || 'items'; const ds = l==='din' ? [...new Set(dinNeed().concat(it.d ? [it.d] : []))].sort() : weekDates();
  return `<select class="day" data-a="mday" data-ml="${l}" data-i="${i}" aria-label="Jour">${it.d && ds.includes(it.d) ? '' : '<option value="" selected>Sans jour</option>'}${ds.map(d => `<option value="${d}" ${it.d===d?'selected':''}>${esc(dayLbl(d))}${isOff(d)?' (congé)':''}</option>`).join('')}</select>`;
}
function mainMeat(it){
  const g = fullIngs(it).filter(g => (g.rayon==='viandes'||g.rayon==='poissonnerie') && !/cuit|tranch|pepperoni|bacon|bologne|fume|saucisses? a hot/.test(norm(g.name))).sort((a,b) => (b.u==='g'?b.q:b.q*150)-(a.u==='g'?a.q:a.q*150))[0];
  return g ? g.name : '';
}
/* Reporter : à demain (les plats suivants glissent d'un jour jusqu'au prochain soir libre), ou à la semaine prochaine. */
const KEEPF = ['r','v','sf','sv','fm','vm','pt','ex','sc','ovr','man'];
function reportWeek(i, quiet){
  const L = mlist('items'), it = L[i]; if(!it) return '';
  const o = {}; KEEPF.forEach(k => { if(it[k]!==undefined) o[k] = it[k]; });
  S.report = (S.report||[]).concat([o]);
  L.splice(i, 1); L.forEach(x => { if(x.after===it.r) delete x.after; });
  const r = byName(it.r), fresh = r && r.i.some(g => g[3]==='viandes' || g[3]==='poissonnerie');
  return quiet ? it.r : `${it.r} est reporté à la semaine prochaine : il sera déjà au menu quand tu la commenceras, et ses ingrédients restent dans Maison.${fresh ? ' Si la viande ou le poisson sont frais, congèle-les.' : ''}`;
}
function reportTomorrow(i){
  const L = mlist('items'), it = L[i]; if(!it) return '';
  const ds = weekDates(), last = ds[ds.length-1];
  if(!it.d) return '';
  let mover = it, d = addDays(it.d, 1); const moved = [];
  for(let k = 0; k < 8 && mover; k++){
    const occ = L.find(x => x!==mover && x.d===d);
    mover.d = d; mover.dfix = true; moved.push(mover.r);
    mover = occ; d = addDays(d, 1);
  }
  const out = L.filter(x => x.d && x.d > last).map(x => L.indexOf(x)).sort((a,b) => b-a).map(j => reportWeek(j, true));
  return `${it.r} est reporté à ${dayLbl(it.d).toLowerCase()}${moved.length>1 ? `; ${moved.slice(1).join(', ')} ${moved.length>2?'glissent':'glisse'} aussi d'un jour` : ''}.${out.length ? ` ${out.join(', ')} passe${out.length>1?'nt':''} à la semaine prochaine.` : ''}`;
}
/* resto ce matin : le déjeuner passe au prochain jour libre de la semaine (même genre de jour si possible) */
function reportDej(i){
  const L = mlist('dej'), it = L[i]; if(!it || !it.d) return '';
  const r = byName(it.r), ds = weekDates().filter(d => d > it.d && !L.some(x => x.d===d));
  const nd = ds.find(d => r && isSimple(r) ? !isOff(d) : isOff(d)) || ds[0];
  if(nd){ it.d = nd; it.dfix = true; return `${it.r} est déplacé à ${dayLbl(nd).toLowerCase()}.`; }
  L.splice(i, 1); return `${it.r} est retiré du menu de cette semaine.`;
}
/* resto ce midi : pas de dîner aujourd'hui; un plat cuisiné prévu va au prochain midi qui en a besoin */
function restoMidi(d){
  const P = dinPlan().find(p => p.d===d && (p.it || p.rest)); if(!P) return '';
  (S.menu.dinNo = S.menu.dinNo||{})[d] = true;
  if(P.rest) return `Pas de dîner à prévoir ce midi. Les restes de ${P.rest.r} se congèlent ou servent un autre jour.`;
  const it = P.it; it.lock = true; delete it.dfix; syncDin(false);
  return it.d && it.d!==d ? `Pas de dîner ce midi. ${it.r} passe au dîner de ${dayLbl(it.d).toLowerCase()}.` : `Pas de dîner ce midi. ${it.r} reste dans les dîners, sans jour pour l'instant.`;
}
function renderReport(){
  const R = S.report||[]; if(!R.length) return '';
  return `<div class="card"><h3>Reporté à la semaine prochaine</h3><p class="small">Ces plats seront déjà au menu de la semaine prochaine. Leurs ingrédients restent dans Maison.</p><div class="list">${R.map((x,j) => `<div class="item"><span class="t"><b>${esc(x.r)}</b></span><button class="btn s" data-a="unrep" data-j="${j}">Remettre cette semaine</button></div>`).join('')}</div></div>`;
}
function renderToday(){
  const m = S.menu; if(!m.date) return '';
  const td = isoToday(), tmw = addDays(td,1), L = mlist('items');
  const tonight = L.find(x => x.d===td), tomorrow = L.find(x => x.d===tmw);
  const dej = mlist('dej').find(x => x.d===td), dejT = mlist('dej').find(x => x.d===tmw);
  const P = dinPlan(), dinP = P.find(p => p.d===td && (p.it || p.rest)), dinT = P.find(p => p.d===tmw);
  if(!tonight && !tomorrow && !dej && !dinP) return '';
  const mij = it => { const r = byName(it.r); if(!r) return false; const mj = mjOf(r); return mj===1 || (mj===2 && it.d && !isOff(it.d) && tmOf(r) > MAX_FOUR) || (!mj && /mijoteuse/.test(norm(r.n+' '+(r.s||'')))); };
  const todo = [];
  if(tonight && mij(tonight)) todo.push(`Ce matin : partir la mijoteuse pour ${tonight.r}.`);
  if(tonight && primOf(tonight)) todo.push(`Ce soir, on utilise les restes de ${primOf(tonight).r}.`);
  if(tonight && follOf(tonight)) todo.push(`Garde les restes de ${tonight.r} : ils servent pour ${follOf(tonight).r}.`);
  if(tomorrow && !primOf(tomorrow)){ const meat = mainMeat(tomorrow); if(meat) todo.push(`Ce soir : sortir ${meat} du congélateur pour demain, si c'est congelé.`); }
  if(tomorrow && mij(tomorrow)) todo.push(`Ce soir : préparer les ingrédients de ${tomorrow.r}; demain matin, partir la mijoteuse.`);
  if(tonight && dinT && dinT.rest===tonight) todo.push(`Garde ${S.p.restes} portion${S.p.restes>1?'s':''} de ${tonight.r} pour le dîner de demain.`);
  if(dejT){ const r = byName(dejT.r); if(r && /la veille/.test(norm(r.s||''))) todo.push(`Ce soir : préparer ${dejT.r} pour demain matin.`); }
  const ti = tonight ? L.indexOf(tonight) : -1;
  const midi = dinP ? (dinP.rest ? 'Restes de '+dinP.rest.r : dinP.it.r) : '';
  /* le prochain repas selon l'heure est mis en avant */
  const hr = new Date().getHours(), slots = [dej ? 'matin' : '', midi ? 'midi' : '', tonight ? 'soir' : ''].filter(Boolean);
  const want = hr < 10 ? ['matin','midi','soir'] : hr < 14 ? ['midi','soir'] : ['soir'];
  const now = want.find(s => slots.includes(s)) || slots[slots.length-1];
  const row = (slot, lbl, name, sub, btn) => `<div class="td-m${slot===now?' now':''}"><span class="td-l">${lbl}</span><b class="td-n">${esc(name)}</b>${sub ? `<span class="td-x">${esc(sub)}</span>` : ''}${btn || ''}</div>`;
  const cb = (ml, i, main) => { const it = mlist(ml)[i], r = it && byName(it.r); return `<button class="btn s ${main?'p':''}" data-a="cook" data-ml="${ml}" data-i="${i}">${r && isSimple(r) ? 'Recette' : 'Cuisiner'}</button>`; };
  const rx = it => { const r = byName(it.r); if(!r) return ''; const a = tpOf(r), t = tmOf(r); return t > a + 5 ? `${fmtMin(a)} de préparation${mjOf(r)===1 ? ', mijoteuse' : ', '+fmtMin(t)+' au total'}` : fmtMin(t); };
  let dl = ''; try{ dl = cap(new Date(td+'T12:00:00').toLocaleDateString('fr-CA', {weekday:'long', day:'numeric', month:'long'})); }catch(e){ dl = dayLbl(td); }
  return `<div class="card today"><p class="td-k">Aujourd'hui</p><h2 class="td-d">${esc(dl)}</h2>
    ${dej ? row('matin', 'Ce matin', dej.r, rx(dej), cb('dej', mlist('dej').indexOf(dej), now==='matin')) : ''}
    ${midi ? row('midi', 'Ce midi', midi, dinP.rest ? 'Les restes du souper d\'hier' : rx(dinP.it), dinP.it ? cb('din', dinP.i, now==='midi') : '') : ''}
    ${tonight ? row('soir', 'Ce soir', tonight.r, [rx(tonight), avecTxt(tonight) ? 'avec '+avecTxt(tonight).split(' + ').map(lowFirst).join(' et ') : ''].filter(Boolean).join(' · '), cb('items', ti, now==='soir')) : ''}
    <div class="td-f">${todo.length?`<ul class="todo">${todo.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
    ${tomorrow?`<p class="td-tm"><span class="small">Demain soir</span> <b>${esc(tomorrow.r)}</b></p>`:''}
    <p class="td-resto"><span class="small">On mange au resto :</span>${dej ? '<button class="lnk2" data-a="resto" data-m="matin">ce matin</button>' : ''}${midi ? '<button class="lnk2" data-a="resto" data-m="midi">ce midi</button>' : ''}${tonight ? '<button class="lnk2" data-a="resto" data-m="soir">ce soir</button>' : ''}</p></div></div>`;
}
/* Collations : fruits d'abord, puis produits laitiers, puis le reste. */
const SNACK_WORDS = ['clementine','mandarine','pomme','banane','raisin','poire','fraise','bleuet','framboise','melon','cantaloup','ananas','kiwi','mangue','orange','mini-carotte','carottes miniatures','yogourt','yop','danino','minigo','fromage ficelle','ficelle','babybel','compote','pouding','jell','noix','amande','galette de riz','craquelin','ritz','goldfish','bretzel','mais souffle','popcorn','barre','muffin','biscuit','croustille','chips','sucette glacee','popsicle','collation'];
const SNACK_RE = SNACK_WORDS.map(w => new RegExp('\\b'+w));
const SNACK_NO = /pomme de terre|pommes de terre|patate|\bjus\b|tarte|sauce|beurre|vinaigre|croustade|gateau|creme glacee|cidre|gelee|confiture|farine|cereale|\bpain\b|poulet|boeuf|porc|sirop|savon|shampo|nourriture|chien|chat\b|litiere|noix de coco|chocolat a cuire|brisure|pepite|chips de chocolat|boisson|gazeuse|crush|muffins? anglais|nourrisson|bebe/;
function snackSugg(){
  if(S.p.snk===false) return [];
  const used = new Set(buyList().rows.map(r => dealFor(r.name)).filter(Boolean).map(x => x.t));
  const added = new Set((S.menu.sn||[]).map(x => x.t)), seen = new Set(), out = [];
  allSpec().forEach(s => { const t = norm(s.t); if(SNACK_NO.test(t) || used.has(s.t) || added.has(s.t)) return; const i = SNACK_RE.findIndex(re => re.test(t)); if(i>=0) out.push({s, i}); });
  out.sort((a,b) => a.i-b.i || priceOf(a.s)-priceOf(b.s));
  return out.filter(x => { if(seen.has(x.i)) return false; seen.add(x.i); return true; }).slice(0,8).map(x => x.s);
}
function renderSnacks(){
  if(S.p.snk===false) return '';
  const m = S.menu, add = (m.sn||[]).filter(x => !x.src), sug = snackSugg(); if(!add.length && !sug.length) return '';
  const dis = '';
  return `<div class="card"><h3>Collations en spécial</h3><p class="small">Des collations annoncées dans tes circulaires. « Ajouter » en met un paquet dans la liste d'épicerie, pour cette semaine seulement.</p><div class="list">`
    + (m.sn||[]).map((x,j) => [x,j]).filter(([x]) => !x.src).map(([x,j]) => `<div class="item"><span class="t">${tagHtml({t:x.t, p:x.p, s:x.s})}<small>Dans la liste</small></span><button class="btn s" data-a="snrm" data-i="${j}" ${dis}>Retirer</button></div>`).join('')
    + sug.map(s => `<div class="item"><span class="t">${tagHtml(s)}</span><button class="btn s p" data-a="snadd" data-t="${esc(s.t)}" ${dis}>Ajouter</button></div>`).join('')
    + `</div></div>`;
}
let pick = {q:'', r:'', v:0};
/* Je reçois ou repas à deux : quelques plats, un nombre de personnes, une liste juste pour ce repas. */
const occ = () => (S.occ = S.occ || {n:2, items:[], home:true});
function occItems(){ return occ().items.map(x => { const r = byName(x.r); if(!r) return null; const it = {r:x.r, v:x.v||0, pt:occ().n, fm:1, vm:1, ex:[]}; if(kindOf(r)==='souper'){ it.sf = x.sf ?? ''; it.sv = x.sv ?? ''; } return it; }).filter(Boolean); }
function occList(){
  const map = new Map();
  occItems().forEach(it => fullIngs(it).forEach(g => { const [q,u] = normQU(g.name, g.q, g.u), k = keyOf(g.name, u), o = map.get(k); if(o) o.q += q; else map.set(k, {k, q, u, name:g.name, rayon:classer(g.name, g.rayon)}); }));
  const rows = [], home = [];
  map.forEach(n => {
    if(isMaison(n.name)){ home.push(n); return; }
    const sk = occ().home ? stockKey(n) : null, st = sk ? S.stock[sk].q : 0, def = n.q - st;
    if(def <= 0.001){ home.push(n); return; }
    const p = packOf(n.name, n.u), buy = p ? Math.ceil(def/p - 1e-9)*p : n.u==='un' ? Math.max(1, Math.ceil(def - 0.05)) : def;
    rows.push({...n, buy});
  });
  return {rows, home};
}
const occText = () => { const {rows} = occList(), o = occ();
  const L = [`ÉPICERIE - repas pour ${o.n} personne${o.n>1?'s':''}`, occItems().map(it => '• '+it.r+(it.v ? ' ('+vname(vars(byName(it.r))[it.v-1][0])+')' : '')).join('\n'), ''];
  RAYONS.forEach(ray => { const R = rows.filter(r => (r.rayon||'épicerie')===ray); if(!R.length) return; L.push(cap(ray)); R.forEach(r => { const d = dealFor(r.name); L.push(`- ${cap(r.name)} : ${fq(r.buy, r.u).replace('× ','')}${d ? ` (spécial ${specTxt(d)})` : ''}`); }); L.push(''); });
  return L.join('\n').trim(); };
function renderOcc(){
  const o = occ(), its = occItems(), open = openPan.has('occ');
  let body = `<p class="small">Tu reçois, ou c'est un souper en amoureux ? Choisis les plats et le nombre de personnes : l'application fait une liste d'épicerie juste pour ce repas, à part de celle de la semaine. Tu peux aussi le mettre au menu un soir.</p>
    <label class="f">Nombre de personnes<select data-a="occ_n">${[1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,24,30].map(n => `<option ${o.n===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <input type="text" id="oc_q" placeholder="Ajouter un plat : entrée, souper, dessert…" autocomplete="off" aria-label="Ajouter un plat au repas"><div class="list" id="oc_res"></div>`;
  if(its.length){
    const {rows, home} = occList();
    body += `<div class="list">${its.map((it,j) => { const r = byName(it.r), vs = vars(r); return `<div class="item"><span class="t"><b>${esc(it.r)}</b><small>${esc([KIND1[kindOf(r)], it.v ? 'version '+vname(vs[it.v-1][0]).toLowerCase() : '', kindOf(r)==='souper' ? (avecTxt(it) ? 'avec '+avecTxt(it).split(' + ').map(lowFirst).join(' et ') : 'sans accompagnement') : ''].filter(Boolean).join(' · '))}</small></span><button class="ib_x" data-a="occ_rm" data-j="${j}" aria-label="Retirer">×</button></div>`; }).join('')}</div>
      <label class="check"><input type="checkbox" data-a="occ_home" ${o.home?'checked':''}> Enlever ce qu'il y a déjà à la maison</label>
      <h3 style="font-size:1.05rem">La liste pour ${o.n} personne${o.n>1?'s':''} <span class="small">${rows.length} article${rows.length>1?'s':''}</span></h3>
      <div class="list">${RAYONS.map(ray => { const R = rows.filter(r => (r.rayon||'épicerie')===ray); return R.length ? `<p class="aisle">${esc(cap(ray))}</p>` + R.map(r => { const d = dealFor(r.name); return `<div class="item"><span class="t"><b>${esc(cap(r.name))}</b>${d ? `<span class="tags">${tagHtml(d)}</span>` : ''}</span><span class="q">${fq(r.buy, r.u)}</span></div>`; }).join('') : ''; }).join('')}</div>
      ${home.length ? `<p class="small">Déjà à la maison : ${esc(home.map(x => x.name).join(', '))}.</p>` : ''}
      <div class="acts"><button class="btn p" data-a="occ_copy">Copier la liste</button><button class="btn s d" data-a="occ_clear">Vider</button></div><div class="small" id="occ_msg"></div>
      <div class="pk_sel"><label class="f">Le mettre au menu de la semaine<select id="oc_d">${weekDates().map(d => { const x = mlist('items').find(y => y.d===d); return `<option value="${d}">${esc(dayLbl(d))} ${x ? '— remplace '+esc(x.r) : '— libre'}</option>`; }).join('')}</select></label>
      <button class="btn s" data-a="occ_menu">Mettre au menu pour ${o.n} personne${o.n>1?'s':''}</button><p class="small">Les plats s'ajoutent alors à la liste de la semaine.</p></div>`;
  }
  return `<details class="card pick" data-pan="occ" ${open?'open':''}><summary>Je reçois ou repas à deux</summary>${body}</details>`;
}
function occToMenu(){
  const o = occ(), d = ($('#oc_d')||{}).value || '', L = mlist('items'); let msg = [];
  occItems().forEach(it => { const r = byName(it.r), kd = kindOf(r);
    if(kd==='sauce'){ return; }
    if(kd==='souper'){ const x = mkItem(r, usedSides(L), it.v); Object.assign(x, {pt:o.n, lock:true}); if(it.sf!==undefined) x.sf = it.sf; if(it.sv!==undefined) x.sv = it.sv;
      if(d){ const j = L.findIndex(y => y.d===d); x.d = d; x.dfix = true; if(j>=0){ msg.push(`${r.n} remplace ${L[j].r}`); L[j] = x; } else L.push(x); } else L.push(x);
      linkFollow(x); }
    else mlist(LOFK[kd]).push({r:r.n, v:it.v, pt:o.n, lock:true}); });
  assignDays(false); o.items = []; S.flash = `Repas pour ${o.n} ajouté au menu${d ? ', '+dayLbl(d).toLowerCase() : ''}.${msg.length ? ' '+msg.join('; ')+'.' : ''}`;
}
function pickSearch(q){
  const n = norm(q).trim(); if(n.length < 2) return [];
  const words = n.split(/\s+/), out = [];
  allRecipes().forEach(r => {
    if(S.dis[r.n]) return;
    const base = norm(r.n+' '+(r.m||[]).join(' ')+' '+r.i.map(g => g[2]).join(' '));
    const vs = vars(r); let v = 0, score = 0;
    if(words.every(w => norm(r.n).includes(w))) score = 3;
    else if(words.every(w => base.includes(w))) score = 1;
    const vi = vs.findIndex(x => words.every(w => norm(x[0]).includes(w) || norm(r.n).includes(w)));
    if(vi >= 0 && score < 3){ v = vi+1; score = Math.max(score, 2); }
    if(score) out.push({r, v, score});
  });
  return out.sort((a,b) => b.score-a.score || a.r.n.localeCompare(b.r.n,'fr')).slice(0, 8);
}
const pickRows = q => { const L = pickSearch(q); if(!L.length) return norm(q).trim().length>=2 ? '<p class="small">Aucun plat trouvé. Essaie un autre mot, ou crée la recette dans l\'onglet Recettes.</p>' : '';
  return L.map(x => { const vs = vars(x.r); return `<div class="item"><span class="t"><b>${esc(x.r.n)}</b><small>${esc([KIND1[kindOf(x.r)], x.v ? 'version '+vname(vs[x.v-1][0]).toLowerCase() : '', tmShort(x.r)].filter(Boolean).join(' · '))}</small></span><button class="btn s" data-a="pk_pick" data-r="${esc(x.r.n)}" data-v="${x.v}">Choisir</button></div>`; }).join(''); };
function renderPicker(){
  const m = S.menu;
  const r = pick.r ? byName(pick.r) : null, open = openPan.has('pick') || !!r;
  let chosen = '';
  if(r){
    const kd = kindOf(r), vs = vars(r), L = mlist('items');
    const verSel = vs.length ? `<label class="f">Version<select data-a="pk_v">${['Normale'].concat(vs.map(x => vname(x[0]))).map((nm,j) => `<option value="${j}" ${pick.v===j?'selected':''}>${esc(nm)}</option>`).join('')}</select></label>` : '';
    let where = '';
    if(kd==='souper' && pick.meal==='din'){
      const P = dinPlan(), ds = weekDates(), st = d => P.find(x => x.d===d);
      const first = (pick.d && ds.includes(pick.d) && pick.d) || ds.find(d => { const p = st(d); return p && !p.it && !p.rest; }) || ds.find(d => !st(d)) || ds[0];
      where = `<div class="seg" role="group" aria-label="Repas"><button data-a="pk_meal" data-v="items">Au souper</button><button class="on" data-a="pk_meal" data-v="din">Au dîner</button></div>
        <label class="f">Quel jour ?<select id="pk_d">${ds.map(d => { const p = st(d); return `<option value="${d}" ${d===first?'selected':''}>${esc(dayLbl(d))} ${p && p.it ? '— remplace '+esc(p.it.r) : p && p.rest ? '— au lieu des restes de '+esc(p.rest.r) : '— libre'}</option>`; }).join('')}</select></label>`;
    } else if(kd==='dejeuner'){
      const D = mlist('dej'), ds = weekDates(), free = ds.find(d => !D.some(x => x.d===d)) || '';
      where = `<label class="f">Quel jour ?<select id="pk_d">${ds.map(d => { const o = D.find(x => x.d===d); return `<option value="${d}" ${d===free?'selected':''}>${esc(dayLbl(d))}${isOff(d)?' (congé)':''} ${o ? '— remplace '+esc(o.r) : '— libre'}</option>`; }).join('')}<option value="" ${free?'':'selected'}>En plus, sans jour précis</option></select></label>`;
    } else if(kd==='souper'){
      const ds = weekDates(), free = ds.find(d => !L.some(x => x.d===d)) || '';
      where = `<div class="seg" role="group" aria-label="Repas"><button class="on" data-a="pk_meal" data-v="items">Au souper</button><button data-a="pk_meal" data-v="din">Au dîner</button></div>
        <label class="f">Quel jour ?<select id="pk_d">${ds.map(d => { const o = L.find(x => x.d===d); return `<option value="${d}" ${d===free?'selected':''}>${esc(dayLbl(d))}${isOff(d)?' (congé)':''} ${o ? '— remplace '+esc(o.r) : '— libre'}</option>`; }).join('')}<option value="" ${free?'':'selected'}>En plus, sans jour précis</option></select></label>`;
    } else if(kd==='sauce'){
      where = L.length ? `<label class="f">Avec quel plat ?<select id="pk_d">${L.map((x,j) => `<option value="${j}">${esc((x.d ? dayLbl(x.d)+' : ' : '')+x.r)}${x.sc ? ' (remplace '+esc(x.sc)+')' : ''}</option>`).join('')}</select></label>` : '<p class="note">Crée d\'abord le menu ou ajoute un souper : la sauce s\'ajoute à un plat.</p>';
    } else where = `<p class="small">S'ajoute aux ${esc(KINDS[kd].toLowerCase())} de la semaine.</p>`;
    chosen = `<div class="pk_sel"><p class="dname">${esc(r.n)}</p>${verSel}${where}
      <div class="acts"><button class="btn p" data-a="pk_add" ${kd==='sauce' && !L.length ? 'disabled' : ''}>${kd==='sauce' ? 'Ajouter la sauce' : 'Ajouter au menu'}</button><button class="btn s" data-a="pk_cancel">Annuler</button></div></div>`;
  }
  return `<details class="card pick" data-pan="pick" ${open?'open':''}><summary>Ajouter un plat de mon choix</summary>
    ${pick.msg ? `<p class="note">${esc(pick.msg)}</p>` : ''}
    <p class="small">${pick.meal==='din' && pick.d ? `Pour le dîner de ${esc(dayLbl(pick.d).toLowerCase())} : cherche un plat dans la banque des soupers.` : "Une envie ? Cherche un plat, une version ou un ingrédient : burger Nashville, smash burger, saumon, soupe… Il reste au menu quand tu le refais."}</p>
    ${chosen || `<input type="text" id="pk_q" value="${esc(pick.q)}" placeholder="Burger, Nashville, saumon, potage…" autocomplete="off" aria-label="Chercher un plat"><div class="list" id="pk_res">${pickRows(pick.q)}</div>`}</details>`;
}
function addPicked(){
  const r = byName(pick.r); if(!r) return;
  const kd = kindOf(r), sel = $('#pk_d'), d = sel ? sel.value : '';
  let msg = '';
  if(kd==='sauce'){ const it = mlist('items')[+d]; if(!it) return; it.sc = r.n; msg = `${r.n} ajoutée à ${it.r}.`; }
  else {
    const l = kd==='souper' && pick.meal==='din' ? 'din' : LOFK[kd], L = mlist(l);
    if(l==='items' || l==='din' || l==='dej'){
      const it = l==='dej' ? {r:r.n, v:pick.v} : mkItem(r, usedSides(L), pick.v); it.lock = true; if(l==='din') it.din = true;
      if(d){
        if(l==='din'){ if(restesAvail(d)) S.menu.dinCook = Object.assign(S.menu.dinCook||{}, {[d]:true}); if(S.menu.dinNo) delete S.menu.dinNo[d]; }
        const j = L.findIndex(x => x.d===d); it.d = d; it.dfix = true; if(j>=0){ msg = `${r.n} remplace ${L[j].r}.`; L[j] = it; } else L.push(it); } else L.push(it);
      if(l==='items'){ linkFollow(it); assignDays(false); } else if(l==='dej') assignDej(false); else syncDin(false);
      msg = msg || `${r.n} ajouté ${l==='items' ? 'au souper' : l==='din' ? 'au dîner' : 'au déjeuner'}${it.d ? ', '+dayLbl(it.d).toLowerCase() : ''}.`;
    } else { L.push({r:r.n, v:pick.v, lock:true}); msg = `${r.n} ajouté aux ${KINDS[kd].toLowerCase()}.`; }
  }
  pick = {q:'', r:'', v:0, msg}; openPan.add('pick'); save(); render();
}
function renderPP(){
  if(S.p.pp==='never') return '';
  const inM = new Set(allItems().map(x => x.r));
  const L = allRecipes().filter(r => r.pp && !S.dis[r.n] && !inM.has(r.n)).map(r => ({r, d:dealsOf(r)})).filter(x => x.d.length);
  if(!L.length) return '';
  return `<div class="card"><h3>Plats préparés en spécial</h3><p class="small">Prêts à servir et en spécial dans tes circulaires. Pratique pour un soir pressé.</p><div class="list">${L.map(x => `<div class="item"><span class="t"><b>${esc(x.r.n)}</b><span class="tags">${tagHtml(x.d[0].hit)}</span></span><button class="btn s" data-a="addrec" data-r="${esc(x.r.n)}" ${S.menu.achete?'disabled':''}>Ajouter</button></div>`).join('')}</div></div>`;
}
function renderMenu(){
  const el = $('#tab-menu'); const m = S.menu; let h = '';
  if(m.date) assignDays(false);
  if(!S.setup) h += renderSetup();
  else if(!S.help) h += `<div class="card call"><h3>Première fois ?</h3><p class="small">L'aide explique comment installer l'application sur l'iPhone, préparer la première semaine et copier la liste.</p><div class="acts"><button class="btn s p" id="help_open">Lire l'aide</button><button class="btn s" id="help_hide">Plus tard</button></div></div>`;
  h += `<p class="note" id="flash" ${S.flash ? '' : 'hidden'}>${esc(S.flash||'')}</p>`; S.flash = '';
  if(S.setup) h += renderToday();
  if(bkBar && S.setup && S.p.bkOpen!==false && (S.bkDirty || !S.lastExport))
    h += `<div class="bkbar"><span><b>Sauvegarde</b> Des changements depuis ta dernière copie${S.lastExport ? ' ('+esc(dShort(S.lastExport))+')' : ''}.</span><button class="btn s p" id="bk_file">Sauvegarder</button><button class="ib_x" data-a="bk_hide" aria-label="Pas maintenant">×</button></div>`;
  { const n = Object.keys(S.stock||{}).length + (S.custom||[]).length*3 + Object.keys(S.prices||{}).length, old = !S.lastExport || addDays(S.lastExport, 30) < isoToday();
    if(S.p.bkOpen===false && S.setup && n >= 10 && old && !(S.bkSnooze && S.bkSnooze > isoToday())) h += `<div class="card"><h3>Protège tes données</h3><p class="small">${S.lastExport ? 'Ta dernière copie dans Fichiers date de plus d\'un mois.' : 'Ton garde-manger et tes recettes ne sont gardés que sur ce téléphone.'} Une copie dans Fichiers les protège si l'icône est supprimée ou si tu changes de téléphone.</p><div class="acts"><button class="btn s p" data-a="bk_go">Faire une copie</button><button class="btn s" data-a="bk_later">Plus tard</button></div></div>`; }
  h += renderWeek();
  if(!m.date){
    h += renderPicker();
    h += renderOcc();
    LISTS.forEach(l => { const L = mlist(l); if(!L.length) return; h += `<h2 class="sec">Tes choix : ${LBL[l].toLowerCase()}<span>${L.length}</span></h2><div class="sheet">${L.map((it,i) => carte(it,i,l)).join('')}</div>`; });
    h += `<div class="empty"><b>Pas encore de menu cette semaine</b>${Object.keys(S.stock).length ? `<span>Les plats qui utilisent tes ${Object.keys(S.stock).length} articles à la maison passeront en premier.</span>` : ''}<span>Cherche les spéciaux, puis touche « Créer le menu ». Les plats servis dans les ${S.p.cool} dernières semaines et ceux mis de côté sont écartés.</span></div>`;
  } else {
    const {rows} = buyList(), nDeal = rows.filter(r => dealFor(r.name)).length;
    if(m.achete) h += `<p class="note">Épicerie faite. Tu peux encore changer les plats, les portions ou ajouter un repas : ce qui manque s'ajoute à la liste, sous « À acheter en plus ».</p>`;
    h += `<div class="card tally"><p><b>${rows.length}</b> article${rows.length>1?'s':''} à acheter${nDeal?`, dont <b>${nDeal}</b> en spécial`:''}<br><span class="small" style="color:inherit;opacity:.85">≈ ${money(listTotals(rows).cost)}${S.p.budget ? ` sur ${money(+S.p.budget)} de budget` : ''}</span></p><button class="btn s p" id="go_liste">Voir la liste</button></div>`;
    h += renderPicker();
    h += renderOcc();
    LISTS.forEach(l => {
      if(l==='din'){ const P = dinPlan(); if(!P.length) return; const nr = P.filter(p => p.rest).length;
        h += `<h2 class="sec">Dîners<span>${P.length}</span></h2>${nr && S.p.dinRestes!==false ? `<p class="small secnote">Le midi, les restes du souper de la veille d'abord. Les autres jours, un plat de la banque des soupers pour ${pDin()} portion${pDin()>1?'s':''}.</p>` : ''}<div class="sheet">${P.map(p => p.it ? carte(p.it, p.i, 'din') : restRow(p)).join('')}</div>`; return; }
      const L = mlist(l); if(!L.length && !nOf(l)) return;
      h += `<h2 class="sec">${LBL[l]}<span>${L.length}</span></h2>`;
      const ord = L.map((it,i) => [it,i]); if(l==='items' || l==='dej') ord.sort((a,b) => (a[0].d||'9').localeCompare(b[0].d||'9'));
      if(ord.length) h += `<div class="sheet">${ord.map(([it,i]) => carte(it,i,l)).join('')}</div>`; });
    h += renderReport();
    h += renderAubaines();
    h += renderPP();
    h += renderSnacks();
    h += renderUtiliser();
    h += `<button class="btn wide" id="gen" data-armed="0">Refaire le menu (les plats gardés restent)</button>`;
    h += exportCard('xm_');
    h += `<div class="card"><h3>Fin de la semaine</h3><p class="small">Retire de la maison ce qui a été utilisé, garde les restes et range les plats dans l'historique pour ne pas les répéter.</p><button class="btn p" id="fin" data-armed="0">Terminer la semaine</button></div>`;
  }
  el.innerHTML = h;
}

/* ---------- rendu : épicerie ---------- */
let storeMode = false, wakeLock = null;
async function lockScreen(on){
  try{
    if(on && 'wakeLock' in navigator && !wakeLock){ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else if(!on && wakeLock){ await wakeLock.release(); wakeLock = null; }
  }catch(e){}
}
document.addEventListener('visibilitychange', () => { if(storeMode && document.visibilityState==='visible') lockScreen(true); });
const mainStore = () => { const go = goStores(); return (S.p.main && go.includes(S.p.main) ? S.p.main : go[0]) || S.p.main || S.stores[0] || 'Mon épicerie'; };
const storeOf = r => { const d = dealFor(r.name); return d ? d.s : mainStore(); };
function specTotal(rows){ let t = 0, n = 0; rows.forEach(r => { const d = dealFor(r.name), c = d ? dealCost(d, r) : null; if(c != null){ t += c; n++; } }); return {t, n}; }
function groupsOf(rows){
  const byRay = list => RAYONS.map(ray => ({ray, rows:list.filter(r => r.rayon===ray).sort((a,b) => a.name.localeCompare(b.name,'fr'))})).filter(g => g.rows.length);
  if(S.p.grp==='magasin'){
    const ms = mainStore(), stores = [...new Set(rows.map(storeOf))].sort((a,b) => a===ms ? -1 : b===ms ? 1 : a.localeCompare(b,'fr'));
    return stores.map(s => ({title:s, sub:byRay(rows.filter(r => storeOf(r)===s))}));
  }
  return byRay(rows).map(g => ({title:cap(g.ray), sub:[{ray:'', rows:g.rows}]}));
}
function rowHtml(r, m){
  const d = dealFor(r.name), pk = packInfo(r), hl = !d && !storeMode ? histLine(r.name) : '';
  return `<label class="item ${m.chk[r.k]?'done':''}"><input type="checkbox" data-a="chk" data-k="${esc(r.k)}" ${m.chk[r.k]?'checked':''}>
    <span class="t"><b>${esc(cap(r.name))}</b>${d?`<span class="tags">${tagHtml(d)}${storeMode ? '' : `<a href="#" class="fixl" data-a="ar_go" data-b="${esc(artB(r.name))}">Pas le bon ?</a>`}</span>`:''}${pk?`<small>${esc(pk)}</small>`:''}${hl?`<small class="hist">${esc(hl)}</small>`:''}${!storeMode && r.st>0?`<small>Il en faut ${fq(r.q,r.u)}, il y en a déjà ${fq(r.st,r.u)} à la maison</small>`:''}${!storeMode && r.src.length?`<small>${esc(r.src.slice(0,3).join(', '))}${r.src.length>3?'…':''}</small>`:''}${cmpLine(r)}</span>
    <span class="qcol"><span class="q">${fq(r.buy,r.u)}</span>${priceBtn(r)}</span></label>`;
}
function cmpLine(r){ const c = cheaper(r); if(!c) return '';
  return `<small class="cmp">${c.aDeal ? `Moins cher chez ${esc(c.store)} : ${money(c.cost)} (${esc(c.A)} : ${money(c.costA)})` : `En spécial chez ${esc(c.store)} : ${money(c.cost)} (≈ ${money(c.costA)} au prix habituel)`}</small>`; }
function priceBtn(r){
  const e = rowEco(r);
  if(prEdit===r.k) return `<input type="text" inputmode="decimal" class="num prin" data-a="pr_in" data-k="${esc(r.k)}" placeholder="Prix payé" aria-label="Prix payé pour ${esc(r.name)}" autofocus>`;
  return `<button type="button" class="prix${e.mine?' mine':''}" data-a="pr_edit" data-k="${esc(r.k)}" aria-label="Corriger le prix">${e.deal || e.mine ? '' : '≈ '}${money(e.cost)}</button>`;
}
const groupHtml = (gs, m) => gs.map(g => `<h2 class="sec">${esc(g.title)}<span>${g.sub.reduce((a,s) => a+s.rows.length, 0)}</span></h2><div class="card list">` + g.sub.map(s => (s.ray ? `<p class="aisle">${esc(cap(s.ray))}</p>` : '') + s.rows.map(r => rowHtml(r,m)).join('')).join('') + `</div>`).join('');
const paidField = m => `<label class="f">Total payé à la caisse ($)<input type="text" inputmode="decimal" class="num" id="paid" value="${m.paid||''}" placeholder="0,00"></label>`;
function budgetHtml(rows){
  const t = listTotals(rows), b = +S.p.budget || 0, rest = b - t.cost;
  const fit = b && rest < 0 && S.menu.date && !S.menu.achete ? `<div class="acts"><button class="btn s" id="bfit">Remplacer des soupers par des plats moins chers</button></div>` : '';
  return `<div class="budget"><p><span class="small">Total estimé</span> <b>≈ ${money(t.cost)}</b>${t.save >= 1 ? `<span class="small"> · ≈ ${money(t.save)} économisés en spéciaux</span>` : ''}</p>
    ${b ? `<div class="bar ${rest<0?'over':''}"><i style="width:${Math.min(100, t.cost/b*100)}%"></i></div><p class="small">Budget ${money(b)} : ${rest >= 0 ? `il reste ≈ <b>${money(rest)}</b>` : `<b class="over">dépasse de ≈ ${money(-rest)}</b>`}</p>` : ''}
    ${fit}${prixVieux() ? `<p class="small over">Les prix de référence Maxi datent du ${esc(PRIX_MAJ_TXT().replace('relevé du ',''))} : le total est probablement sous-estimé.</p>` : ''}<p class="small">Prix réguliers du barème Maxi (${esc(PRIX_MAJ_TXT())}) pour les formats à acheter (le reste du format va dans Maison), remplacés par les spéciaux et par tes prix : touche un prix pour le corriger.</p></div>`;
}
/* Épiceries laissées de côté cette semaine : combien on y sauverait (rien n'est changé dans la liste). */
function ailleurs(rows){
  const go = goStores(), sk = S.stores.filter(s => !go.includes(s)); if(!sk.length || !go.length) return [];
  const pool = allSpecAll().filter(s => sk.includes(s.s)), by = new Map();
  rows.filter(r => !S.menu.chk[r.k]).forEach(r => {
    const cur = rowEco(r).cost; let best = null;
    matchesFor(r.name, pool).forEach(s => { if(!isFinite(priceOf(s))) return; const c = dealCost(s, r); if(c != null && (!best || c < best.c)) best = {s, c}; });
    if(best && best.c < cur*0.9 && cur - best.c >= 0.5){ const o = by.get(best.s.s) || {n:0, save:0, names:[]}; o.n++; o.save += cur - best.c; o.names.push(r.name); by.set(best.s.s, o); }
  });
  return [...by.entries()].filter(x => x[1].save >= 5).sort((a,b) => b[1].save - a[1].save);
}
function cmpCard(rows){
  const C = rows.filter(r => !S.menu.chk[r.k]).map(r => ({r, c:cheaper(r)})).filter(x => x.c), A = ailleurs(rows);
  if(!C.length && !A.length) return '';
  let h = '';
  if(C.length){
    const by = new Map(); C.forEach(x => { const o = by.get(x.c.store) || {n:0, save:0}; o.n++; o.save += x.c.save; by.set(x.c.store, o); });
    const tot = C.reduce((a,x) => a + x.c.save, 0);
    h += `<h3>Moins cher ailleurs</h3><p class="small">Parmi les épiceries où tu vas cette semaine.</p>
    <ul class="todo">${[...by.entries()].sort((a,b) => b[1].save - a[1].save).map(([s,o]) => `<li><b>${esc(s)}</b> : ${o.n} article${o.n>1?'s':''}, ≈ ${money(o.save)} de moins</li>`).join('')}</ul>
    <p class="small">${tot >= 10 ? `≈ ${money(tot)} en tout : ça vaut peut-être le détour.` : `≈ ${money(tot)} en tout : probablement pas assez pour un détour.`} Le détail est sous chaque article.</p>`;
  }
  if(A.length){
    const go = goStores();
    h += `${C.length ? '<p class="small"><b>Dans tes autres épiceries</b></p>' : '<h3>Dans tes autres épiceries</h3>'}<p class="small">Cette semaine, tu fais l'épicerie seulement chez ${esc(go.join(', '))}. Pour info : ${A.map(([s,o]) => `chez ${esc(s)}, ≈ ${money(o.save)} de moins sur ${o.n} article${o.n>1?'s':''} (${esc(o.names.slice(0,3).join(', '))}${o.n>3?'…':''})`).join('; ')}. Ta liste ne change pas.</p>
    <div class="acts">${A.slice(0,2).map(([s]) => `<button class="btn s" data-a="goadd" data-s="${esc(s)}">Ajouter ${esc(s)} cette semaine</button>`).join('')}</div>`;
  }
  return `<div class="card cmpc">${h}</div>`;
}
function renderEpicerie(){
  const el = $('#tab-epicerie'); const m = S.menu;
  if(!m.date){ storeMode = false; lockScreen(false); }
  document.body.classList.toggle('store', storeMode);
  if(!m.date){ el.innerHTML = `<div class="empty"><b>La liste se construit toute seule</b><span>Crée d'abord le menu de la semaine dans l'onglet Menu.</span></div>`; return; }
  const {rows, covered, verify} = buyList();
  let h = '';
  if(m.achete && m.snap && !storeMode){
    const got = m.snap.filter(r => r.ok).length;
    h += `<div class="card"><h3>Épicerie faite</h3><p class="small">${got} article${got>1?'s':''} ajouté${got>1?'s':''} à la maison (onglet Maison). Tu peux encore changer le menu : ce qui manque apparaît ci-dessous.</p>${paidField(m)}</div>`;
    if(!rows.length){ el.innerHTML = h + `<div class="empty"><b>Rien à acheter en plus</b><span>Tout ce qu'il faut pour le menu est à la maison.</span></div>`; return; }
    h += `<h2 class="sec">À acheter en plus<span>${rows.length}</span></h2><p class="small">Ce qui n'a pas été acheté, ou ce que tes changements au menu demandent.</p>`;
    h += groupHtml(groupsOf(rows), m);
    h += `<div class="card"><button class="btn p" id="store_on">Mode magasin</button><button class="btn" id="achete" style="margin-top:8px">Ces achats sont faits</button></div>`;
    el.innerHTML = h; return;
  }
  const done = rows.filter(r => m.chk[r.k]).length, pct = rows.length ? done/rows.length*100 : 0;
  if(storeMode){
    const todo = rows.filter(r => !m.chk[r.k]), got = rows.filter(r => m.chk[r.k]);
    h += `<div class="storebar"><div><b id="pg-t">${done} sur ${rows.length} dans le panier</b><div class="bar"><i id="pg-b" style="width:${pct}%"></i></div></div><button class="btn s" id="store_off">Quitter</button></div>`;
    h += groupHtml(groupsOf(todo), m);
    if(!todo.length) h += `<div class="empty"><b>Tout est dans le panier</b><span>Touche « Quitter », puis « Épicerie terminée » une fois à la maison.</span></div>`;
    if(got.length) h += `<h2 class="sec">Dans le panier<span>${got.length}</span></h2><div class="card list">${got.sort((a,b) => a.name.localeCompare(b.name,'fr')).map(r => rowHtml(r,m)).join('')}</div>`;
    el.innerHTML = h; return;
  }
  const st = specTotal(rows);
  h += `<div class="card"><h2 style="font-size:1.25rem">Épicerie du ${esc(fmtDate(shopISO()))}</h2><p class="small" id="pg-t">${done} sur ${rows.length} dans le panier</p><div class="bar"><i id="pg-b" style="width:${pct}%"></i></div>
    <div class="seg" role="group" aria-label="Regrouper la liste"><button class="${S.p.grp!=='magasin'?'on':''}" data-a="grp" data-v="rayon">Par rayon</button><button class="${S.p.grp==='magasin'?'on':''}" data-a="grp" data-v="magasin">Par magasin</button></div>
    ${budgetHtml(rows)}
    <button class="btn p" id="store_on">Mode magasin</button></div>`;
  if(S.p.grp==='magasin') h += `<p class="small">Chaque article va au magasin où il est le moins cher en spécial; le reste va à ${esc(mainStore())}. Les prix des circulaires ne sont pas toujours pour le même format.</p>`;
  h += cmpCard(rows);
  h += renderAubaines();
  h += groupHtml(groupsOf(rows), m);
  if(verify.length){
    h += `<h2 class="sec">Vérifier avant de partir<span>${verify.length}</span></h2><div class="card list"><p class="small">Ces articles sont censés être déjà à la maison. S'il en manque un, touche « Il manque » : il passe dans la liste.</p>`;
    verify.sort((a,b)=>a.name.localeCompare(b.name,'fr')).forEach(v => {
      h += `<div class="item"><span class="t"><b>${esc(cap(v.name))}</b><small>Pour : ${esc(v.src.slice(0,3).join(', '))}</small></span><button class="btn s ${v.manque?'p':''}" data-a="manque" data-k="${esc(v.k)}">${v.manque?'Ajouté':'Il manque'}</button></div>`;
    });
    h += `</div>`;
  }
  if(covered.length) h += `<details class="card"><summary>Déjà à la maison <span class="rm">${covered.length}</span></summary>${covered.sort((a,b)=>a.name.localeCompare(b.name,'fr')).map(c=>`<div class="item"><span class="t"><b>${esc(cap(c.name))}</b></span><span class="q">${fq(c.q,c.u)}</span></div>`).join('')}</details>`;
  h += exportCard('xe_');
  h += `<div class="card"><h3>De retour de l'épicerie</h3><p class="small">Les articles cochés entrent dans l'onglet Maison. Ce qui n'est pas utilisé cette semaine reste en stock et sera déduit de la prochaine liste.</p>${paidField(m)}<button class="btn p" id="achete">Épicerie terminée</button></div>`;
  el.innerHTML = h;
}

/* ---------- rendu : maison (garde-manger) ---------- */
let filtre = '', anRay = '';
function anFill(c, keep){
  const info = $('#an_info'); if(!info) return;
  if(c){ $('#an').value = c.n; $('#au').value = c.u; $('#ar').value = c.ray; $('#acat').value = catGuess(c); info.textContent = 'Aliment connu : unité, rayon et catégorie remplis. Vérifie la quantité.'; }
  else if($('#an').value.trim()){ $('#ar').value = guessRayon($('#an').value); info.textContent = 'Nouvel aliment : vérifie son rayon et sa catégorie.'; }
  else info.textContent = '';
  const sg = $('#an_sugg'); if(sg && !keep) sg.innerHTML = '';
}
function stepOf(u){ return u==='un' ? 1 : 100; }
function renderMaison(){
  const el = $('#tab-maison');
  const items = Object.entries(S.stock).filter(([k,o]) => !filtre || norm(o.name).includes(norm(filtre))).sort((a,b) => a[1].name.localeCompare(b[1].name,'fr'));
  let h = `<div class="card"><h3>Ce qu'il y a à la maison</h3><p class="small">Ce qui est ici est déduit de la prochaine liste, et le menu favorise les plats qui l'utilisent. Acheté hors liste, du fromage pour un lunch par exemple ? Ajoute-le en bas.</p>
    <input type="text" id="filt" placeholder="Chercher" value="${esc(filtre)}" aria-label="Chercher"></div>`;
  if(!items.length) h += `<div class="empty"><b>Rien à la maison pour l'instant</b><span>Après ta première épicerie, les restes apparaissent ici, par exemple 4 oeufs sur 12. Tu peux aussi ajouter ce que tu as déjà.</span></div>`;
  else RAYONS.forEach(ray => {
    const L = items.filter(([k,o]) => (o.rayon||'épicerie')===ray); if(!L.length) return;
    h += `<h2 class="sec">${esc(ray[0].toUpperCase()+ray.slice(1))}<span>${L.length}</span></h2><div class="card list">` + L.map(([k,o]) => `<div class="item"><span class="t"><b>${esc(cap(o.name))}</b><select class="mini" data-a="stcat" data-k="${esc(k)}" aria-label="Catégorie">${CATS.map(([v,n]) => `<option value="${v}" ${(o.cat||'')===v?'selected':''}>${n}</option>`).join('')}</select>${(o.cat==='f'||o.cat==='v')?`<button class="btn s" data-a="keepside" data-k="${esc(k)}">En faire un accompagnement</button>`:''}</span><div class="step"><button data-a="stm" data-k="${esc(k)}" aria-label="Moins">−</button><input type="text" inputmode="decimal" class="num" data-a="stq" data-k="${esc(k)}" value="${Math.round(o.q*10)/10}" aria-label="Quantité en ${o.u}"><span class="small">${o.u}</span><button data-a="stp" data-k="${esc(k)}" aria-label="Plus">+</button></div></div>`).join('') + `</div>`;
  });
  h += `<div class="card"><h3>Ajouter un article</h3>
    <label class="f">Aliment<input type="text" id="an" placeholder="Tape quelques lettres : fromage, poulet, lait…" autocomplete="off"></label>
    <div class="sugg" id="an_sugg"></div>
    <details class="panel" data-pan="an_browse" ${openPan.has('an_browse')?'open':''}><summary>Ou choisir par rayon</summary>
      <div class="chips">${RAYONS.map(r => `<button type="button" class="chip${anRay===r?' on':''}" data-a="an_ray" data-r="${esc(r)}">${esc(cap(r))}</button>`).join('')}</div>
      ${anRay ? `<div class="sugg">${sugBtns(catalog().filter(c => c.ray===anRay), 'data-a="an_pick"')}</div>` : ''}</details>
    <p class="small" id="an_info"></p>
    <div class="grid2"><label class="f">Quantité<input type="text" inputmode="decimal" class="num" id="aq" value="1"></label><label class="f">Unité<select id="au">${UNITS.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></label></div>
    <div class="grid2"><label class="f">Rayon<select id="ar">${RAYONS.map(r=>`<option>${r}</option>`).join('')}</select></label>
    <label class="f">Catégorie<select id="acat">${CATS.map(([v,n]) => `<option value="${v}">${n}</option>`).join('')}</select></label></div>
    <p class="small">Féculent ou légume : le menu pourra s'en servir comme accompagnement (par exemple un sac de rouleaux de printemps = féculent). Collation : il apparaît dans « À utiliser cette semaine ».</p>
    <button class="btn p" id="aadd">Ajouter à la maison</button><div class="small" id="amsg"></div></div>`;
  el.innerHTML = h;
}


/* ---------- banque de recettes : ajout de plats et de variantes ---------- */
const RAY_WORDS = {
  'viandes':['poulet','boeuf','porc','saucisse','jambon','bacon','dinde','bologne','agneau','steak','cote','pepperoni','salami','bavette','filet mignon'],
  'poissonnerie':['poisson','saumon','crevette','morue','aiglefin','thon'],
  'produits laitiers':['lait','creme','fromage','beurre','yogourt','oeuf','mozzarella','cheddar','parmesan','feta','ricotta','babeurre'],
  'fruits et légumes':['oignon','ail','tomate','laitue','carotte','poivron','brocoli','patate','pomme','concombre','champignon','chou','epinard','avocat','citron','lime','celeri','persil','coriandre','ananas','courgette','mais frais','haricot vert','salade','basilic','ciboulette','aneth','menthe','gingembre','echalote','poireau','radis','betterave','navet','fraise','framboise','banane','raisin','poire','melon','mangue','kiwi','clementine','herbes fraiches'],
  'boulangerie':['pain','tortilla','pita','naan','bun','brioche','sous-marin','hamburger','hot-dog'],
  'surgelés':['surgele','frite','egg roll','pogo','pate a tarte','abaisse'],
  'garde-manger':['farine','sucre','sel','poivre','epice','cannelle','paprika','cayenne','cumin','origan','huile','fecule','poudre','bicarbonate','cassonade']
};
function guessRayon(name){
  const n = norm(name);
  for(const [ray,words] of Object.entries(RAY_WORDS)) if(words.some(w => n.includes(w))) return ray;
  return 'épicerie';
}
/* ---------- formulaires guidés : catalogue d'aliments ---------- */
const UNITS = [['un','unités'],['g','g'],['kg','kg'],['ml','ml'],['L','L']];
const toBase = (q,u) => u==='kg' ? [q*1000,'g'] : u==='L' ? [q*1000,'ml'] : [q, u];
const niceUnit = (q,u) => u==='g' && q>=1000 && q%100===0 ? [q/1000,'kg'] : u==='ml' && q>=1000 && q%100===0 ? [q/1000,'L'] : [q, u];
const lowFirst = s => s ? s.charAt(0).toLowerCase()+s.slice(1) : s;
const plain = n => String(n||'').replace(/\s*\([^)]*\)/g,'').trim();
function catalog(){
  if(_CAT) return _CAT;
  const m = new Map();
  const add = (n,u,ray,w) => { const nm = plain(n); const b = baseOf(nm); if(!b || b.length<2) return; let o = m.get(b); if(!o){ o = {b, names:{}, units:{}, rays:{}}; m.set(b,o); } o.names[nm]=(o.names[nm]||0)+w; o.units[u]=(o.units[u]||0)+w; o.rays[ray]=(o.rays[ray]||0)+w; };
  allRecipes().forEach(r => { r.i.forEach(g => add(g[2],g[1],g[3],1)); (r.v||[]).forEach(v => deltaItems(v[1]).add.forEach(a => add(a.name,a.u,a.ray||guessRayon(a.name),1))); });
  SIDES.concat(S.sidesx||[]).forEach(s => s.i.forEach(g => add(g[2],g[1],g[3],1)));
  ESS_START().concat(S.ess||[], S.snacks||[]).forEach(s => add(s.name,s.u,s.r,2));
  Object.values(S.stock).forEach(o => add(o.name,o.u,o.rayon||'épicerie',2));
  const top = o => Object.entries(o).sort((a,b) => b[1]-a[1])[0][0];
  _CAT = [...m.values()].map(o => { const n = top(o.names), ray = top(o.rays); return {n:cap(n), u:top(o.units), ray:classer(n, RAYONS.includes(ray) ? ray : guessRayon(n)), b:o.b}; }).sort((a,b) => a.n.localeCompare(b.n,'fr'));
  return _CAT;
}
const catFind = name => { const b = baseOf(plain(name)); return b ? catalog().find(c => c.b===b) || null : null; };
function catSearch(q, max){
  const n = norm(q).trim(); if(n.length<2) return [];
  const words = n.split(/\s+/);
  return catalog().filter(c => { const t = norm(c.n); return words.every(w => t.includes(w)); })
    .sort((a,b) => (norm(b.n).startsWith(n)?1:0) - (norm(a.n).startsWith(n)?1:0) || a.n.length - b.n.length).slice(0, max||6);
}
function catGuess(c){
  const n = norm(c.n);
  if(c.ray==='viandes' || c.ray==='poissonnerie') return 'p';
  if(/abaisse|pate a tarte|pate feuillet|pate a pizza/.test(n)) return '';
  if(/frite|pomme de terre|patate|\briz\b|\bpates\b|spaghetti|macaroni|penne|fusilli|linguine|rotini|tortellini|ravioli|orzo|vermicelle|nouille|pain|tortilla|naan|gnocchi|egg roll|rouleau|couscous|quinoa/.test(n)) return 'f';
  if(/brocoli|haricot|mais|pois|carotte|salade|laitue|concombre|chou|epinard|courgette|poivron|legume/.test(n)) return 'v';
  if(/yogourt|ficelle|croustille|barre|biscuit|compote|noix|amande|fromage|craquelin|muffin|fruit/.test(n)) return 'c';
  return '';
}
/* Brouillons : les formulaires gardent ce qui est tapé même quand l'écran se redessine. */
let drafts = {}, openPan = new Set();
const emptyRows = n => Array.from({length:n}, () => ({n:'', q:'', u:'un', ray:''}));
const rowsFromIng = ing => ing.map(g => { const [q,u] = niceUnit(+g[0], g[1]); return {n:cap(g[2]), q:String(+(+q).toFixed(3)), u, ray:g[3]}; });
const draftFor = (key, init) => drafts[key] || (drafts[key] = init());
const F = (dk, df) => `data-dk="${esc(dk)}" data-df="${df}"`;
const say = (el, txt) => { if(el){ el.textContent = txt; el.hidden = !txt; } };
function bindDraft(t){
  const dk = t.dataset && t.dataset.dk, df = t.dataset && t.dataset.df; if(!dk || !df || !drafts[dk]) return false;
  const d = drafts[dk];
  if(df==='rem' || t.dataset.arr){ const s = new Set(d[df]||[]); if(t.checked) s.add(t.value); else s.delete(t.value); d[df] = [...s]; }
  else if(t.type==='checkbox') d[df] = t.checked;
  else if(t.multiple) d[df] = [...t.selectedOptions].map(o => o.value);
  else d[df] = t.value;
  return true;
}
const rayPick = (key,j,x) => `<label class="f">Nouvel aliment : dans quel rayon ?<select class="ib_ray" data-ib="${esc(key)}" data-j="${j}">${RAYONS.map(r => `<option ${(x.ray||guessRayon(x.n))===r?'selected':''}>${r}</option>`).join('')}</select></label>`;
function ibRow(key, j, x){
  const a = `data-ib="${esc(key)}" data-j="${j}"`, known = x.n ? catFind(x.n) : null;
  return `<div class="ibw"><div class="ibr"><input type="text" class="ib_n" ${a} value="${esc(x.n||'')}" placeholder="Aliment : tape quelques lettres" aria-label="Aliment ${j+1}" autocomplete="off">
    <button type="button" class="ib_x" data-a="ib_rm" ${a} aria-label="Retirer cet ingrédient">×</button>
    <div class="sugg"></div>
    <input type="text" inputmode="decimal" class="num ib_q" ${a} value="${esc(x.q||'')}" placeholder="Qté" aria-label="Quantité">
    <select class="ib_u" ${a} aria-label="Unité">${UNITS.map(([v,l]) => `<option value="${v}" ${(x.u||'un')===v?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="ib_rw">${x.n && !known ? rayPick(key,j,x) : ''}</div></div>`;
}
const ingBuilder = (key, rows) => `<div class="ib">${rows.map((x,j) => ibRow(key,j,x)).join('')}<button type="button" class="btn s" data-a="ib_add" data-ib="${esc(key)}">+ Ajouter un ingrédient</button></div>`;
function readRows(rows){
  const ing = []; let err = '';
  rows.forEach((x,j) => {
    const n = String(x.n||'').trim(), qs = String(x.q||'').trim();
    if(!n && !qs) return;
    if(!n){ err = err || `Ligne ${j+1} : choisis un aliment.`; return; }
    const q = parseFloat(qs.replace(',','.'));
    if(!(q>0)){ err = err || `« ${n} » : indique une quantité.`; return; }
    const [qq,uu] = toBase(q, x.u||'un'), c = catFind(n);
    ing.push([qq, uu, lowFirst(n), c ? c.ray : (x.ray || guessRayon(n))]);
  });
  return {ing, err};
}
const sugBtns = (list, attrs) => list.map(c => `<button type="button" ${attrs} data-c="${esc(c.n)}">${esc(c.n)}<small>${esc(c.ray)}</small></button>`).join('');

let rf = {q:'', k:'', pr:'', st:'', g:'pr', fast:false, fav:false, dis:false}, openRec = new Set();
function recFiltered(){
  const q = norm(rf.q);
  return allRecipes().filter(r => {
    if(rf.k==='acc') return false;
    if(q && !norm(r.n+' '+(r.m||[]).join(' ')+' '+r.i.map(g => g[2]).join(' ')+' '+vars(r).map(v => v[0]).join(' ')).includes(q)) return false;
    if(rf.k && kindOf(r)!==rf.k) return false;
    if(rf.pr && prOf(r)!==rf.pr) return false;
    if(rf.st && !styOf(r).includes(rf.st)) return false;
    if(rf.fast && tpOf(r) > 30) return false;
    if(rf.fav && !S.fav[r.n]) return false;
    if(!!S.dis[r.n] !== !!rf.dis) return false;
    return true;
  }).sort((a,b) => a.n.localeCompare(b.n,'fr'));
}
const sideOpts = (sl, cur, withAuto, withDef) => (withDef?`<option value="def" ${cur==='def'?'selected':''}>Celui du plat</option>`:'') + (withAuto?`<option value="auto" ${cur==='auto'?'selected':''}>Auto (varie)</option>`:'') + `<option value="" ${cur===''?'selected':''}>Aucun</option>` + sidesOf(sl).filter(s => !s.id.startsWith('st:')).map(s => `<option value="${esc(s.id)}" ${cur===s.id?'selected':''}>${esc(s.n)}</option>`).join('');
function varEditor(r, row){
  const key = row ? `va|${r.n}|${row.src}|${row.i}` : `vn|${r.n}`, souper = kindOf(r)==='souper';
  const d = draftFor(key, () => {
    const v = row ? row.v : ['', '', ''], dd = deltaItems(v[1]), t = v[0]||'', ix = t.indexOf(':');
    const rem = []; dd.rem.filter(x => !x.q).forEach(x => r.i.forEach(g => { if(norm(g[2]).includes(norm(x.name)) && !rem.includes(g[2])) rem.push(g[2]); }));
    return {nm:ix>0 ? t.slice(0,ix).trim() : t, ds:ix>0 ? t.slice(ix+1).trim() : '', p:v[2]||'',
      f:dd.f===undefined ? 'def' : (dd.f==='aucun' ? '' : dd.f), v:dd.v===undefined ? 'def' : (dd.v==='aucun' ? '' : dd.v),
      rows:dd.add.length ? dd.add.map(a => { const [q,u] = niceUnit(a.q,a.u); return {n:cap(a.name), q:String(q), u, ray:a.ray}; }) : emptyRows(1),
      rem, keep:dd.rem.filter(x => x.q).map(x => `-${x.q} ${x.u} ${x.name}`)};
  });
  const B = (a, label, cls) => `<button class="btn s ${cls}" data-a="${a}" data-r="${esc(r.n)}" data-key="${esc(key)}"${row ? ` data-s="${row.src}" data-i="${row.i}"` : ''}${a==='vrm' ? ' data-armed="0"' : ''}>${label}</button>`;
  return `<div class="vbox">
    <label class="f">Nom de la version<input type="text" ${F(key,'nm')} value="${esc(d.nm)}" placeholder="Épicée, Nashville…"></label>
    <label class="f">Description<input type="text" ${F(key,'ds')} value="${esc(d.ds)}" placeholder="Ce qui change, en quelques mots"></label>
    <p class="small"><b>Ingrédients à retirer</b> (touche pour cocher)</p>
    <div class="chips">${r.i.map(g => `<label class="chip rm"><input type="checkbox" ${F(key,'rem')} value="${esc(g[2])}" ${d.rem.includes(g[2])?'checked':''}>${esc(cap(g[2]))}</label>`).join('')}</div>
    <p class="small"><b>Ingrédients à ajouter</b></p>
    ${ingBuilder(key, d.rows)}
    ${souper ? `<div class="grid2"><label class="f">Féculent<select ${F(key,'f')}>${sideOpts('f', d.f, false, true)}</select></label><label class="f">Légume ou salade<select ${F(key,'v')}>${sideOpts('v', d.v, false, true)}</select></label></div>` : ''}
    <label class="f">Préparation de cette version<textarea ${F(key,'p')}>${esc(d.p)}</textarea></label>
    <div class="note ve_msg" hidden></div>
    <div class="acts">${row ? B('vsave','Enregistrer','p')+B('vrm','Retirer cette version','d') : B('vadd','Ajouter la version','p')}</div></div>`;
}
function varFromDraft(key){
  const d = drafts[key]; if(!d) return {err:'Rien à enregistrer.'};
  const nm = String(d.nm||'').trim(); if(!nm) return {err:'Donne un nom à la version.'};
  const {ing, err} = readRows(d.rows); if(err) return {err};
  const toks = ing.map(([q,u,n,ray]) => `+${q} ${u} ${n}|${ray}`).concat((d.rem||[]).map(n => `-${n}`), d.keep||[]);
  if(d.f!=='def') toks.push('@f='+(d.f||'aucun'));
  if(d.v!=='def') toks.push('@v='+(d.v||'aucun'));
  const title = String(d.ds||'').trim() ? nm+' : '+String(d.ds).trim() : nm, p = String(d.p||'').trim();
  return {val: p ? [title, toks.join(' ; '), p] : [title, toks.join(' ; ')]};
}
function recEditor(r){
  const key = 'edit|'+r.n;
  const d = draftFor(key, () => ({k:kindOf(r), pr:r.pr||'', st:styOf(r), t:r.t||'viande', tm:String(tmOf(r)), tp:String(tpOf(r)), mj:!!mjOf(r), sp:!!r.sp, sf:r.sf||'', sv:r.sv||'', m:(r.m||[]).join(', '), s:r.s||'', rows:rowsFromIng(r.i)}));
  return `<div class="rbox">
    <div class="grid2"><label class="f">Genre<select ${F(key,'k')}>${Object.entries(KIND1).map(([k,v]) => `<option value="${k}" ${d.k===k?'selected':''}>${v}</option>`).join('')}</select></label>
    <label class="f">Protéine<select ${F(key,'pr')}><option value="">Automatique</option>${Object.entries(PRS).map(([k,v]) => `<option value="${k}" ${d.pr===k?'selected':''}>${v}</option>`).join('')}</select></label></div>
    <p class="small"><b>Styles</b> (touche pour choisir, un ou plusieurs)</p><div class="chips">${Object.entries(STYS).map(([k,v]) => `<label class="chip"><input type="checkbox" ${F(key,'st')} data-arr="1" value="${k}" ${d.st.includes(k)?'checked':''}>${v}</label>`).join('')}</div>
    <div class="grid2"><label class="f">Type (accompagnements)<select ${F(key,'t')}>${Object.entries(TYPES).map(([k,v]) => `<option value="${k}" ${d.t===k?'selected':''}>${v}</option>`).join('')}</select></label>
    <label class="f">Préparation<select ${F(key,'tp')}>${optMin(TP_L, d.tp||d.tm)}</select></label></div>
    <div class="grid2"><label class="f">Temps total<select ${F(key,'tm')}>${optMin(TM_L, d.tm)}</select></label>
    <label class="check"><input type="checkbox" ${F(key,'mj')} ${d.mj?'checked':''}> Peut cuire à la mijoteuse pendant la journée</label></div>
    <label class="check"><input type="checkbox" ${F(key,'sp')} ${d.sp?'checked':''}> Déjeuner de semaine (jours de travail) ou dessert simple (pas proposé, sauf si permis dans Réglages)</label>
    <div class="grid2"><label class="f">Féculent par défaut<select ${F(key,'sf')}>${sideOpts('f', d.sf, true)}</select></label><label class="f">Légume par défaut<select ${F(key,'sv')}>${sideOpts('v', d.sv, true)}</select></label></div>
    <p class="small"><b>Ingrédients</b>${kindOf(r)==='souper' ? ' pour 6 portions' : ''}. Tape quelques lettres et choisis l'aliment proposé.</p>
    ${ingBuilder(key, d.rows)}
    <label class="f">Mots pour trouver les spéciaux (virgules)<input type="text" ${F(key,'m')} value="${esc(d.m)}"></label>
    <label class="f">Préparation<textarea ${F(key,'s')}>${esc(d.s)}</textarea></label>
    <div class="note re_msg" hidden></div>
    <div class="acts"><button class="btn s p" data-a="rsave" data-r="${esc(r.n)}">Enregistrer la recette</button>${!r.c && S.redit[r.n] ? `<button class="btn s" data-a="rreset" data-r="${esc(r.n)}">Revenir à l'original</button>` : ''}</div></div>`;
}
/* Accompagnements d'une recette : « varié » (l'application choisit), aucun, ou un accompagnement fixe. */
function recSides(r){
  const base = RECIPES.find(x => x.n===r.n) || r, nm = id => (sideById(id)||{}).n || '';
  const sel = slot => { const cur = (slot==='f' ? r.sf : r.sv) ?? '', fixed = r.fx && r.fx[slot] && sideById(cur), pref = !fixed && cur && cur!=='auto' && sideById(cur) ? nm(cur) : '';
    const val = fixed ? cur : cur==='' ? '' : 'auto';
    return `<option value="auto" ${val==='auto'?'selected':''}>Varié chaque semaine${pref ? ' (souvent '+esc(pref.toLowerCase())+')' : ''}</option><option value="" ${val===''?'selected':''}>Aucun</option>`
      + sidesOf(slot).filter(s => !s.id.startsWith('st:')).map(s => `<option value="${esc(s.id)}" ${val===s.id?'selected':''}>${esc(s.n)}${(S.sdis||{})[s.id]?' (mis de côté)':''}</option>`).join(''); };
  return `<div class="sidepick"><p class="small"><b>Accompagnements</b> (${esc((TYPES[r.t||'viande']||'').toLowerCase())}). Varié : l'application choisit chaque semaine parmi ceux qui vont avec ce plat. Choisis-en un pour l'avoir à tout coup.</p>
    <div class="grid2"><label class="f">Féculent<select data-a="rside" data-r="${esc(r.n)}" data-s="f">${sel('f')}</select></label><label class="f">Légume ou salade<select data-a="rside" data-r="${esc(r.n)}" data-s="v">${sel('v')}</select></label></div></div>`;
}
function setRecSide(name, slot, val){
  const r = byName(name); if(!r) return;
  const base = RECIPES.find(x => x.n===name), key = slot==='f' ? 'sf' : 'sv';
  const fx = Object.assign({}, r.fx||{}); let sv;
  if(val==='auto'){ const orig = base ? base[key] : r[key]; sv = orig && orig!=='' ? orig : 'auto'; fx[slot] = false; }
  else if(val===''){ sv = ''; fx[slot] = false; }
  else { sv = val; fx[slot] = true; }
  if(r.c){ const c = S.custom.find(x => x.n===name); if(c){ c[key] = sv; c.fx = fx; } }
  else S.redit[name] = Object.assign({}, S.redit[name]||{}, {[key]:sv, fx});
  openRec.add(name); save(); render();
}
/* Liste des accompagnements dans Recettes */
function sidesSection(){
  const q = norm(rf.q), dis = S.sdis||{};
  const L = ALLS().filter(s => !s.id.startsWith('st:') && (!q || norm(s.n+' '+s.i.map(g => g[2]).join(' ')).includes(q)) && (!rf.dis || dis[s.id]));
  if(!L.length) return '';
  const row = s => { const k = 'side|'+s.id, open = openRec.has(k), mine = (S.sidesx||[]).some(x => x.id===s.id);
    return `<details class="row" data-rec="${esc(k)}" ${open?'open':''}><summary><span>${esc(s.n)}${dis[s.id]?' <span class="small">(mis de côté)</span>':''}${mine?' <span class="small">(le tien)</span>':''}</span></summary>
      <div class="rbody"><p class="small">Va avec : ${esc((s.ty||[]).map(t => t==='all' ? 'tous les plats' : (TYPES[t]||t).toLowerCase()).join(', ') || 'tous les plats')}. Quantités pour 6 portions.</p>
      <ul class="ing">${s.i.map(g => `<li><span>${esc(g[2])}</span><span>${fq(g[0],g[1])}</span></li>`).join('')}</ul>
      <div class="acts"><button class="btn s ${dis[s.id]?'p':''}" data-a="sdis" data-id="${esc(s.id)}">${dis[s.id] ? 'Le proposer de nouveau' : 'Ne plus le proposer'}</button>${mine ? `<button class="btn s d" data-a="sdel2" data-id="${esc(s.id)}">Supprimer</button>` : ''}</div></div></details>`; };
  const f = L.filter(s => s.sl==='f'), v = L.filter(s => s.sl==='v');
  return `<h2 class="sec">Accompagnements<span>${L.length}</span></h2><div class="card list">${f.length ? `<p class="aisle">Féculents</p>${f.map(row).join('')}` : ''}${v.length ? `<p class="aisle">Légumes et salades</p>${v.map(row).join('')}` : ''}</div>
    <p class="small" style="padding:0 4px">Pour en créer un : « Nouvel accompagnement » en haut de l'onglet.</p>`;
}
function recBody(r, idx){
  const rows = varRows(r), mod = !r.c && (S.vared[r.n] || S.vardel[r.n]);
  const kd = kindOf(r);
  return `${metaTags(r, kd==='souper')}
    <div class="acts"><button class="btn s p" data-a="radd" data-r="${esc(r.n)}" data-v="0">${kd==='sauce' ? 'Ajouter à un plat du menu' : 'Ajouter au menu de la semaine'}</button>${kd==='sauce' ? '' : `<button class="btn s" data-a="cook" data-r="${esc(r.n)}">Cuisiner</button>`}</div>
    ${kd==='souper' ? recSides(r) : ''}${!r.c && S.redit[r.n] ? '<p class="small"><b>Recette modifiée par toi.</b></p>' : ''}
    <div class="grid2"><label class="f">Préparation<select data-a="tpsel" data-r="${esc(r.n)}">${optMin(TP_L, tpOf(r))}</select></label>
    <label class="f">Temps total<select data-a="tmsel" data-r="${esc(r.n)}">${optMin(TM_L, tmOf(r))}</select></label></div>
    ${kd==='souper' ? `<p class="small">${isLong(r) ? 'Placé un jour de congé' : 'Possible un soir de semaine'} : seule la préparation compte${mjOf(r)===2 && tmOf(r) > MAX_FOUR ? ', et il peut cuire à la mijoteuse pendant la journée' : ''}.</p>` : ''}
    <div class="acts"><button class="btn s ${S.fav[r.n]?'p':''}" data-a="fav" data-r="${esc(r.n)}">${S.fav[r.n]?'Favori ✓':'Ajouter aux favoris'}</button>
      <button class="btn s ${S.dis[r.n]?'p':''}" data-a="rdis" data-r="${esc(r.n)}">${S.dis[r.n]?'Remettre dans la banque':"Je n'aime pas"}</button></div>
    <ul class="ing">${r.i.map(g=>`<li><span>${esc(g[2])}</span><span>${fq(g[0],g[1])}</span></li>`).join('')}</ul>
    ${r.s?`<p class="steps">${esc(r.s)}</p>`:''}
    <h3 style="font-size:1rem">Variantes <span class="small">${rows.length}</span></h3>
    ${rows.length ? rows.map(row => { const pk = `va|${r.n}|${row.src}|${row.i}`; return `<div class="card" style="background:var(--bg)"><b>${esc(vname(row.v[0]))}${row.edited?' <span class="small">(modifiée)</span>':''}${row.src==='x'?' <span class="small">(ajoutée)</span>':''}</b>${varDetail(row.v)}
      <div class="acts"><button class="btn s" data-a="radd" data-r="${esc(r.n)}" data-v="${rows.indexOf(row)+1}">Ajouter cette version au menu</button></div>
      <details class="panel" data-pan="${esc(pk)}" ${openPan.has(pk)?'open':''}><summary>Modifier cette version</summary>${openPan.has(pk) ? varEditor(r,row) : ''}</details></div>`; }).join('') : '<p class="small">Aucune pour l\'instant.</p>'}
    ${mod ? `<p class="small"><a href="#" data-a="vrestore" data-r="${esc(r.n)}">Rétablir les variantes d'origine</a></p>` : ''}
    <details class="card" style="background:var(--bg)" data-pan="vn|${esc(r.n)}" ${openPan.has('vn|'+r.n)?'open':''}><summary>Ajouter une version</summary>${openPan.has('vn|'+r.n) ? varEditor(r,null) : ''}</details>
    <details class="card" style="background:var(--bg)" data-pan="edit|${esc(r.n)}" ${openPan.has('edit|'+r.n)?'open':''}><summary>Modifier la recette</summary>${openPan.has('edit|'+r.n) ? recEditor(r) : ''}</details>
    <div class="acts"><button class="btn s" data-a="rshare2" data-r="${esc(r.n)}" data-x="${idx}">Copier cette recette</button>${r.c?`<button class="btn s d" data-a="rdel" data-r="${esc(r.n)}" data-armed="0">Supprimer cette recette</button>`:''}</div><div class="small" id="rm2_${idx}"></div>`;
}
function renderRecettes(){
  const el = $('#tab-recettes');
  const list = recFiltered();
  const sel = (key, label, opts) => `<label class="f">${label}<select data-rf="${key}">${opts.map(([v,n]) => `<option value="${v}" ${rf[key]===v?'selected':''}>${n}</option>`).join('')}</select></label>`;
  const chk = (key, label) => `<label class="chip"><input type="checkbox" data-rf="${key}" ${rf[key]?'checked':''}>${label}</label>`;
  let h = `<div class="card"><input type="text" id="rfilt" placeholder="Chercher (nom ou ingrédient)" value="${esc(rf.q)}" aria-label="Chercher">
    <div class="grid2">${sel('k','Genre',[['','Tout'],...Object.entries(KINDS),['acc','Accompagnements']])}${sel('pr','Protéine',[['','Toutes'],...Object.entries(PRS)])}${sel('st','Style',[['','Tous'],...Object.entries(STYS)])}${sel('g','Regrouper par',[['pr','Protéine'],['st','Style'],['k','Genre'],['','Ordre alphabétique']])}</div>
    <div class="chips">${chk('fast','Préparation 30 min ou moins')}${chk('fav','Favoris')}${chk('dis',"Mis de côté")}</div>
    <p class="small">${list.length} recette${list.length>1?'s':''} sur ${allRecipes().length}.</p></div>`;
  const dn = draftFor('new', () => ({n:'', k:'souper', pr:'', st:[], t:'viande', tm:'30', tp:'20', mj:false, sf:'auto', sv:'auto', fam:false, m:'', s:'', rows:emptyRows(4)}));
  const ds = draftFor('side', () => ({n:'', sl:'f', rows:emptyRows(3)}));
  h += `<div class="card list"><details class="row" ${openRec.has('__new')?'open':''} data-rec="__new"><summary>Nouvelle recette</summary><div class="rbody">
    ${dn.note ? `<p class="note">${esc(dn.note)}</p>` : ''}
    <label class="f">Nom du plat<input type="text" ${F('new','n')} value="${esc(dn.n)}" placeholder="Poulet à la crème"></label>
    <div class="grid2"><label class="f">Genre<select ${F('new','k')}>${Object.entries(KIND1).map(([k,v]) => `<option value="${k}" ${dn.k===k?'selected':''}>${v}</option>`).join('')}</select></label>
    <label class="f">Protéine<select ${F('new','pr')}><option value="">Automatique</option>${Object.entries(PRS).map(([k,v]) => `<option value="${k}" ${dn.pr===k?'selected':''}>${v}</option>`).join('')}</select></label></div>
    <p class="small"><b>Styles</b> (touche pour choisir, un ou plusieurs)</p><div class="chips">${Object.entries(STYS).map(([k,v]) => `<label class="chip"><input type="checkbox" ${F('new','st')} data-arr="1" value="${k}" ${dn.st.includes(k)?'checked':''}>${v}</label>`).join('')}</div>
    <div class="grid2"><label class="f">Type (accompagnements)<select ${F('new','t')}>${Object.entries(TYPES).map(([k,v]) => `<option value="${k}" ${dn.t===k?'selected':''}>${v}</option>`).join('')}</select></label>
    <label class="f">Préparation<select ${F('new','tp')}>${optMin(TP_L, dn.tp||dn.tm)}</select></label></div>
    <div class="grid2"><label class="f">Temps total<select ${F('new','tm')}>${optMin(TM_L, dn.tm)}</select></label>
    <label class="check"><input type="checkbox" ${F('new','mj')} ${dn.mj?'checked':''}> Peut cuire à la mijoteuse pendant la journée</label></div>
    <div class="grid2"><label class="f">Féculent<select ${F('new','sf')}>${sideOpts('f', dn.sf, true)}</select></label><label class="f">Légume ou salade<select ${F('new','sv')}>${sideOpts('v', dn.sv, true)}</select></label></div>
    <label class="check"><input type="checkbox" ${F('new','fam')} ${dn.fam?'checked':''}> La famille aime ce plat (il revient plus souvent)</label>
    <p class="small"><b>Ingrédients pour 6 portions.</b> Tape quelques lettres et choisis l'aliment proposé : l'unité et le rayon se remplissent tout seuls.</p>
    ${ingBuilder('new', dn.rows)}
    <label class="f">Mots pour trouver les spéciaux (virgules, facultatif)<input type="text" ${F('new','m')} value="${esc(dn.m)}" placeholder="poulet, crème"></label>
    <label class="f">Préparation<textarea ${F('new','s')}>${esc(dn.s)}</textarea></label>
    <div id="nr_msg" class="note" hidden></div>
    <button class="btn p" id="nr_save">Enregistrer la recette</button></div></details>`;
  h += `<details class="row" ${openRec.has('__side')?'open':''} data-rec="__side"><summary>Nouvel accompagnement</summary><div class="rbody">
    <label class="f">Nom<input type="text" ${F('side','n')} value="${esc(ds.n)}" placeholder="Riz aux légumes"></label>
    <label class="f">Sorte<select ${F('side','sl')}><option value="f" ${ds.sl==='f'?'selected':''}>Féculent</option><option value="v" ${ds.sl==='v'?'selected':''}>Légume ou salade</option></select></label>
    <p class="small"><b>Ingrédients pour 6 portions</b></p>
    ${ingBuilder('side', ds.rows)}
    <div id="ns_msg" class="note" hidden></div><button class="btn p" id="ns_save">Enregistrer l'accompagnement</button>
    ${(S.sidesx||[]).length?`<p class="small">Les tiens : ${S.sidesx.map(s=>`${esc(s.n)} <a href="#" data-a="sdel" data-id="${esc(s.id)}">retirer</a>`).join(', ')}</p>`:''}</div></details>
    <details class="row" ${openRec.has('__imp')?'open':''} data-rec="__imp"><summary>Importer une recette copiée</summary><div class="rbody">
    <p class="small">Colle une recette copiée d'un site (Ricardo, 5-15, Pratico-pratiques, Trois fourchettes…) : sélectionne le titre, les ingrédients et la préparation, puis Copier. Le formulaire « Nouvelle recette » se remplit pour que tu vérifies avant d'enregistrer. Une recette copiée avec « Copier la recette » de l'application est ajoutée directement, versions comprises.</p>
    <textarea id="imp_txt" placeholder="Colle le message ici"></textarea>
    <button class="btn p" id="imp_go">Importer</button><div class="small" id="imp_msg"></div></div></details></div>`;
  const grp = r => rf.g==='pr' ? (kindOf(r)==='souper' ? PRS[prOf(r)] : KINDS[kindOf(r)]) : rf.g==='st' ? (STYS[styOf(r)[0]]||'Autres') : rf.g==='k' ? KINDS[kindOf(r)] : '';
  const order = rf.g==='pr' ? [...Object.values(PRS), ...Object.values(KINDS)] : rf.g==='st' ? [...Object.values(STYS),'Autres'] : Object.values(KINDS);
  const groups = new Map(); list.forEach(r => { const g = grp(r); if(!groups.has(g)) groups.set(g, []); groups.get(g).push(r); });
  [...groups.keys()].sort((a,b) => order.indexOf(a)-order.indexOf(b)).forEach(g => {
    if(g) h += `<h2 class="sec">${esc(g)}<span>${groups.get(g).length}</span></h2>`;
    h += `<div class="card list">`;
    groups.get(g).forEach(r => {
      const idx = list.indexOf(r), open = openRec.has(r.n);
      h += `<details class="row" data-rec="${esc(r.n)}" data-lazy="1" ${open?'open':''}><summary><span>${esc(r.n)}${S.fav[r.n]?' <span class="small">(favori)</span>':''}</span><span class="rm">${tmList(r)}</span></summary>${open ? `<div class="rbody">${recBody(r, idx)}</div>` : ''}</details>`;
    });
    h += `</div>`;
  });
  const showSides = (rf.k==='' || rf.k==='acc') && !rf.pr && !rf.st && !rf.fast && !rf.fav;
  const sides = showSides ? sidesSection() : '';
  if(!list.length && !sides) h += `<div class="empty"><b>Aucune recette</b><span>Rien ne correspond à ces filtres. Retire un filtre ou change la recherche.</span></div>`;
  h += sides;
  el.innerHTML = h;
}
function saveRecette(){
  const d = drafts.new, msg = $('#nr_msg'); if(!d) return;
  const name = String(d.n||'').trim();
  if(!name){ say(msg, 'Donne un nom au plat.'); return; }
  if(allRecipes().some(r => norm(r.n)===norm(name))){ say(msg, 'Une recette porte déjà ce nom.'); return; }
  const {ing, err} = readRows(d.rows); if(err){ say(msg, err); return; }
  if(!ing.length){ say(msg, 'Ajoute au moins un ingrédient.'); return; }
  let mots = String(d.m||'').split(',').map(x => x.trim()).filter(Boolean);
  if(!mots.length) mots = autoMots(ing, name);
  const k = d.k;
  S.custom.push({n:name, e:d.fam ? 'ff' : '', m:mots, k, pr:d.pr, st:d.st, t:d.t, tm:+d.tm, tp:Math.min(+d.tp||+d.tm, +d.tm), mj:d.mj ? 1 : 0, sf:k==='souper' ? d.sf : '', sv:k==='souper' ? d.sv : '', nw:true, c:true, i:ing, s:String(d.s||'').trim(), v:[]});
  delete drafts.new; openRec.delete('__new'); openRec.add(name); rf = Object.assign(rf, {q:'', k:'', pr:'', st:'', fast:false, fav:false, dis:false});
  save(); render();
}
function saveRecEdit(btn){
  const r = byName(btn.dataset.r), key = 'edit|'+btn.dataset.r, d = drafts[key], msg = btn.closest('.rbox').querySelector('.re_msg'); if(!r || !d) return;
  const {ing, err} = readRows(d.rows); if(err){ say(msg, err); return; }
  if(!ing.length){ say(msg, 'La recette doit garder au moins un ingrédient.'); return; }
  const k = d.k;
  const patch = {k, pr:d.pr, st:d.st, t:d.t, tm:+d.tm, tp:Math.min(+d.tp||+d.tm, +d.tm), mj:d.mj ? (mjOf(r)||1) : 0, sp:d.sp ? 1 : 0, sf:k==='souper' ? d.sf : '', sv:k==='souper' ? d.sv : '', i:ing, m:String(d.m||'').split(',').map(x => x.trim()).filter(Boolean), s:String(d.s||'').trim()};
  if(r.c) Object.assign(S.custom.find(x => x.n===r.n), patch); else S.redit[r.n] = patch;
  delete S.tmx[r.n]; delete (S.tpx||{})[r.n]; delete drafts[key]; openPan.delete(key); openRec.add(r.n); save(); render();
}
function saveSide(){
  const d = drafts.side, msg = $('#ns_msg'); if(!d) return;
  const n = String(d.n||'').trim(); if(!n){ say(msg, "Donne un nom à l'accompagnement."); return; }
  const {ing, err} = readRows(d.rows); if(err){ say(msg, err); return; }
  if(!ing.length){ say(msg, 'Ajoute au moins un ingrédient.'); return; }
  S.sidesx = S.sidesx||[]; S.sidesx.push({id:'x'+Date.now().toString(36), n, sl:d.sl, ty:['all'], i:ing});
  delete drafts.side; openRec.delete('__side'); save(); render();
}

/* ---------- onglet Articles ---------- */
const BOISSON_RE = /\b(jus(?! de (citron|lime))|boissons?|gazeuses?|eau petillante|eau de source|cafe|the|tisane|bieres?|cola|limonade|cidre)\b/;
const COLL_RE = /croustilles?|\bchips\b|biscuits?|barres? tendres?|craquelins?|mais souffle|bretzels?|melange de noix|bonbons?|guimauves?|compotes?|collations?|pouding|jello|\bjell/;
/* rayon d'un article : celui choisi dans Articles, sinon boissons et collations sortis de l'épicerie générale */
function classer(name, ray){
  const A = art(name); if(A.ray) return A.ray;
  ray = RAYONS.includes(ray) ? ray : (ray ? guessRayon(name) : 'épicerie');
  if(ray==='épicerie' || ray==='garde-manger'){ const n = norm(name); if(BOISSON_RE.test(n)) return 'boissons'; if(COLL_RE.test(n)) return 'collations'; }
  return ray;
}
let artF = {q:'', f:'week'}, artSq = {};
function artSet(b, patch){
  S.art = S.art || {}; const o = Object.assign({}, S.art[b], patch);
  Object.keys(o).forEach(k => { const v = o[k]; if(v==='' || v==null || (Array.isArray(v) && !v.length)) delete o[k]; });
  if(Object.keys(o).some(k => k!=='n')) S.art[b] = o; else delete S.art[b];
}
function artList(f){
  const m = new Map(), put = (b, n, u, ray, row) => { if(!m.has(b)) m.set(b, {b, n:cap(plain(n)), u, ray, row}); };
  if(f==='week') buyList().rows.forEach(r => put(artB(r.name), r.name, r.u, r.rayon, r));
  else if(f==='mod'){ const ks = new Set(Object.keys(S.art||{}).concat(Object.keys(S.menu.dsel||{})));
    ks.forEach(b => { const c = catalog().find(x => x.b===b), r = S.menu.date ? buyList().rows.find(x => artB(x.name)===b) : null; put(b, r ? r.name : c ? c.n : ((S.art||{})[b]||{}).n || b, r ? r.u : c ? c.u : 'un', r ? r.rayon : c ? c.ray : 'épicerie', r); }); }
  else { if(S.menu.date) buyList().rows.forEach(r => put(artB(r.name), r.name, r.u, r.rayon, r)); catalog().forEach(c => put(c.b, c.n, c.u, c.ray, null)); }
  let L = [...m.values()]; const q = norm(artF.q).trim();
  if(q) L = L.filter(x => q.split(/\s+/).every(w => norm(x.n).includes(w)));
  return L.sort((a,b) => a.n.localeCompare(b.n,'fr'));
}
function artRow(x){
  const key = 'art|'+x.b, open = openPan.has(key), d = dealFor(x.n), man = (S.menu.dsel||{})[x.b], A = (S.art||{})[x.b] || {};
  const st = man==='none' ? 'Aucun spécial' : d ? `${d.s}${d.p ? ' · '+d.p : ''}` : '—';
  const mod = Object.keys(A).some(k => k!=='n') || man;
  return `<details class="row art" data-pan="${esc(key)}" data-b="${esc(x.b)}" ${open?'open':''}><summary><span class="an">${esc(x.n)}<small>${esc(cap(x.ray||'épicerie'))}${mod ? ' · modifié' : ''}</small></span><span class="rm${d?' sp':''}">${esc(st)}</span></summary>${open ? `<div class="rbody">${artBody(x)}</div>` : ''}</details>`;
}
function artSearchRows(b, q){
  const n = norm(q).trim(); if(n.length < 2) return '';
  const w = n.split(/\s+/), L = allSpec().filter(s => w.every(x => norm(s.t+' '+s.s).includes(x))).slice(0, 8);
  if(!L.length) return '<p class="small">Aucun spécial avec ces mots cette semaine.</p>';
  return L.map(s => `<div class="item"><span class="t">${tagHtml(s)}</span><span class="acts"><button class="btn s" data-a="ar_spick" data-b="${esc(b)}" data-id="${esc(spId(s))}" data-v="w">Cette semaine</button><button class="btn s p" data-a="ar_spick" data-b="${esc(b)}" data-id="${esc(spId(s))}" data-v="a">Toujours</button></span></div>`).join('');
}
function artBody(x){
  const b = x.b, A = (S.art||{})[b] || {}, man = (S.menu.dsel||{})[b], u = x.u || 'un';
  const row = x.row || {name:x.n, u, buy: u==='un' ? 1 : 1000, rayon:x.ray, k:keyOf(x.n,u)};
  const cur = dealFor(x.n), have = S.auto || (S.spec||[]).length;
  const C = dealCands(x.n, prep(allSpec())).map(s => ({s, c: isFinite(priceOf(s)) ? dealCost(s, row) : Infinity})).sort((a,b) => a.c - b.c);
  const bA = `data-b="${esc(b)}" data-n="${esc(x.n)}" data-u="${esc(u)}"`;
  let h = `<p class="sgrp">Spécial cette semaine</p>`;
  if(!have) h += `<p class="small">Cherche d'abord les spéciaux (carte de la semaine, onglet Menu).</p>`;
  else {
    if(man==='none') h += `<p class="small">Tu as choisi : aucun spécial pour cet article cette semaine.</p>`;
    h += C.length ? `<div class="list">${C.slice(0,6).map(({s,c}) => { const on = cur && spId(cur)===spId(s); return `<div class="item"><span class="t">${tagHtml(s)}${x.row && isFinite(c) ? `<small>≈ ${money(c)} pour ${esc(qt(row.buy, row.u))}</small>` : ''}</span>${on ? '<span class="small ok">Associé</span>' : `<button class="btn s" data-a="ar_pick" ${bA} data-id="${esc(spId(s))}">Choisir</button>`}<button class="btn s d" data-a="ar_ex" ${bA} data-id="${esc(spId(s))}" title="Ce produit n'est pas cet article : ne plus jamais l'associer">Pas ce produit</button></div>`; }).join('')}</div>`
      : `<p class="small">Aucun spécial trouvé avec les mots « ${esc((A.kw || reqToks(x.n).join(' ')))} ».</p>`;
    h += `<div class="acts">${man!=='none' ? `<button class="btn s" data-a="ar_none" ${bA}>Aucun spécial cette semaine</button>` : ''}${man ? `<button class="btn s" data-a="ar_auto" ${bA}>Revenir à l'automatique</button>` : ''}</div>
      <label class="f">Chercher le bon spécial dans les circulaires<input type="text" class="ar_sq" data-b="${esc(b)}" value="${esc(artSq[b]||'')}" placeholder="Un mot du produit ou de la marque" autocomplete="off"></label>
      <div class="list ar_sr" data-b="${esc(b)}">${artSearchRows(b, artSq[b]||'')}</div>
      <p class="small">« Cette semaine » associe ce spécial jusqu'à la fin de la semaine. « Toujours » retient aussi ce produit : il sera reconnu les prochaines semaines.</p>`;
  }
  const H = (S.ph||{})[b] || [];
  h += `<p class="sgrp">Prix en spécial vus</p>${H.length ? `<ul class="todo">${H.map(e => `<li>${esc(dShort(e.d))} · ${esc(e.s)} · <b>${esc(money(e.p))}</b> · ${esc(e.t)}${e.r ? ` (habituel ≈ ${esc(money(e.r))})` : ''}</li>`).join('')}</ul>` : `<p class="small">Rien encore : le prix trouvé est noté à chaque recherche des spéciaux.</p>`}`;
  const est = prixBase(x.n, u, x.ray) * (u==='un' ? 1 : 1000), L = (S.prices||{})[keyOf(x.n,u)], unit = u==='g' ? '$ / kg' : u==='ml' ? '$ / L' : '$ / unité';
  const bt = baremeTxt(x.n); if(bt) h += `<p class="small"><b>Prix réguliers (barème Maxi)</b> : ${esc(bt)}.</p>`;
  h += `<p class="sgrp">Trouver ses spéciaux</p>
    <label class="f">Mots recherchés (une virgule sépare deux façons de le nommer)<input type="text" class="ar_in" data-k="kw" ${bA} value="${esc(A.kw||'')}" placeholder="${esc(reqToks(x.n).join(' '))}"></label>
    <label class="f">Mots à exclure<input type="text" class="ar_in" data-k="no" ${bA} value="${esc(A.no||'')}" placeholder="pané, assaisonné, bio…"></label>
    ${(A.ex||[]).length ? `<p class="small">Produits écartés : ${esc(A.ex.slice(-5).join(' ; '))}${A.ex.length > 5 ? ' …' : ''}. <a href="#" data-a="ar_unex" ${bA}>Les reprendre</a></p>` : ''}
    ${(A.learn||[]).length ? `<p class="small">Produits retenus : ${esc(A.learn.map(t => t.join(' ')).join(' ; '))}. <a href="#" data-a="ar_unlearn" ${bA}>Oublier</a></p>` : ''}
    <p class="sgrp">Classement, format et prix</p>
    <div class="grid2"><label class="f">Rayon<select class="ar_in" data-k="ray" ${bA}><option value="">Automatique</option>${RAYONS.map(r => `<option value="${r}" ${A.ray===r?'selected':''}>${esc(cap(r))}</option>`).join('')}</select></label>
      <label class="f">Prix habituel (${unit})<input type="text" inputmode="decimal" class="ar_in num" data-k="pu" ${bA} value="${L && !L.sp ? String(Math.round(L.pu*(u==='un'?1:1000)*100)/100).replace('.', ',') : ''}" placeholder="≈ ${String(Math.round(est*100)/100).replace('.', ',')}"></label></div>
    <div class="grid2"><label class="f">Se vend par paquet de<input type="text" inputmode="decimal" class="ar_in num" data-k="pkq" ${bA} value="${A.pk ? String(A.pk.q).replace('.', ',') : ''}" placeholder="${packOf(x.n, u) || '—'}"></label>
      <label class="f">Unité du paquet<select class="ar_in" data-k="pku" ${bA}>${[['un','unités'],['g','g'],['ml','ml']].map(([v,t]) => `<option value="${v}" ${((A.pk && A.pk.u) || u)===v?'selected':''}>${t}</option>`).join('')}</select></label></div>
    ${Object.keys(A).some(k => k!=='n') || man ? `<button class="btn s d" data-a="ar_reset" ${bA}>Tout remettre par défaut</button>` : ''}`;
  return h;
}
/* convertisseur : poids, volumes (tasse de 250 ml), densités courantes, prix à la livre et au kilo */
const CV_U = [['g','g',1,'m'],['kg','kg',1000,'m'],['lb','lb',453.6,'m'],['oz','oz',28.35,'m'],['ml','ml',1,'v'],['L','L',1000,'v'],['tasse','tasse',250,'v'],['cs','c. à soupe',15,'v'],['ct','c. à thé',5,'v']];
const CV_D = [['','Liquide (eau, lait, bouillon)',1],['farine','Farine',0.53],['sucre','Sucre',0.85],['cassonade','Cassonade',0.85],['glace','Sucre à glacer',0.5],['beurre','Beurre',0.96],['huile','Huile',0.92],['riz','Riz',0.85],['avoine',"Flocons d'avoine",0.38],['fromage','Fromage râpé',0.45],['chapelure','Chapelure',0.45],['cacao','Cacao',0.42],['miel','Miel',1.42],['sirop',"Sirop d'érable",1.32],['pepites','Pépites de chocolat',0.7]];
let cv = {q:'1', u:'tasse', i:'farine', pq:'', pu:'lb'};
const nfr = (x, d) => String(Math.round(x * 10**d) / 10**d).replace('.', ',');
const nAuto = x => x >= 100 ? nfr(x, 0) : x >= 10 ? nfr(x, 1) : nfr(x, 2);
function frac(x){
  const w = Math.floor(x + 1e-9), r = x - w, F = [[0,''],[.25,'¼'],[1/3,'⅓'],[.5,'½'],[2/3,'⅔'],[.75,'¾'],[1,'']];
  const [v, s] = F.reduce((a, f) => Math.abs(f[0]-r) < Math.abs(a[0]-r) ? f : a);
  if(Math.abs(v-r) > .04) return nAuto(x);
  const W = w + (v===1 ? 1 : 0); return W ? W+(s ? ' '+s : '') : (s || '0');
}
function convOut(){
  const q = parseFloat(String(cv.q).replace(',', '.')), U = CV_U.find(x => x[0]===cv.u), D = (CV_D.find(x => x[0]===cv.i) || CV_D[0])[2];
  if(!(q > 0) || !U) return '<p class="small">Entre une quantité.</p>';
  const g = U[3]==='m' ? q*U[2] : q*U[2]*D, ml = U[3]==='v' ? q*U[2] : q*U[2]/D;
  const M = [['g', nAuto(g)], ['kg', nAuto(g/1000)], ['lb', nAuto(g/453.6)], ['oz', nAuto(g/28.35)]];
  const V = [['ml', nAuto(ml)], ['L', nAuto(ml/1000)], [ml/250 > 1 ? 'tasses' : 'tasse', frac(ml/250)], ml <= 300 ? ['c. à soupe', frac(ml/15)] : null, ml <= 60 ? ['c. à thé', frac(ml/5)] : null].filter(Boolean);
  return `<div class="cvo">${M.concat(V).filter(([u]) => u!==U[1] && !(U[0]==='tasse' && u==='tasses')).map(([u, v]) => `<span><b>${v}</b> ${u}</span>`).join('')}</div>
    <p class="small">${U[3]==='m' ? 'Volumes' : 'Poids'} calculés pour : ${esc((CV_D.find(x => x[0]===cv.i) || CV_D[0])[1].toLowerCase())}. Tasse de 250 ml, c. à soupe de 15 ml, c. à thé de 5 ml.</p>`;
}
function convPrix(){
  const v = parseFloat(String(cv.pq).replace(',', '.')); if(!(v > 0)) return '';
  const o = cv.pu==='lb' ? [[v*2.2046,'$ / kg'],[v/4.536,'$ / 100 g']] : cv.pu==='kg' ? [[v/2.2046,'$ / lb'],[v/10,'$ / 100 g']] : [[v*10,'$ / kg'],[v*4.536,'$ / lb']];
  return o.map(([x,u]) => `<span><b>${nfr(x, 2)}</b> ${u}</span>`).join('');
}
function convCard(){
  const open = openPan.has('conv');
  return `<details class="card pick" data-pan="conv" ${open?'open':''}><summary>Convertisseur de mesures et de prix</summary>
    <div class="grid2"><label class="f">Quantité<input type="text" inputmode="decimal" id="cv_q" value="${esc(cv.q)}"></label>
      <label class="f">Unité<select id="cv_u">${CV_U.map(([v,t]) => `<option value="${v}" ${cv.u===v?'selected':''}>${t}</option>`).join('')}</select></label></div>
    <label class="f">Aliment (pour passer d'un volume à un poids)<select id="cv_i">${CV_D.map(([v,t]) => `<option value="${v}" ${cv.i===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
    <div id="cv_out">${convOut()}</div>
    <p class="sgrp">Prix au poids</p>
    <div class="grid2"><label class="f">Montant ($)<input type="text" inputmode="decimal" id="cvp_q" value="${esc(cv.pq)}" placeholder="4,99"></label>
      <label class="f">Par<select id="cvp_u">${[['lb','livre (lb)'],['kg','kilo (kg)'],['100g','100 g']].map(([v,t]) => `<option value="${v}" ${cv.pu===v?'selected':''}>${t}</option>`).join('')}</select></label></div>
    <div class="cvo" id="cvp_out">${convPrix()}</div></details>`;
}
function renderArticles(){
  const el = $('#tab-articles'), f = artF.f==='week' && !S.menu.date ? 'all' : artF.f;
  const L = artList(f), shown = L.slice(0, 150);
  let h = `<div class="card"><h2 style="font-size:1.25rem">Articles</h2><p class="small">Le spécial associé à chaque article. S'il n'est pas le bon, ouvre l'article : choisis le bon, exclus-le, ou change les mots, le rayon, le format ou le prix habituel. Ces réglages restent pour les prochaines semaines.</p>
    <input type="text" id="ar_q" value="${esc(artF.q)}" placeholder="Chercher un article" aria-label="Chercher un article" autocomplete="off">
    <div class="seg" role="group" aria-label="Articles à afficher">${[['week','Ma liste'],['all','Tous'],['mod','Modifiés']].map(([v,t]) => `<button class="${f===v?'on':''}" data-a="ar_f" data-v="${v}" ${v==='week' && !S.menu.date ? 'disabled' : ''}>${t}</button>`).join('')}</div></div>`;
  h += convCard();
  if(shown.length) h += `<div class="card list">${shown.map(artRow).join('')}</div>`;
  else h += `<div class="empty"><b>Aucun article</b><span>${f==='mod' ? "Aucun article modifié pour l'instant." : 'Rien ne correspond à cette recherche.'}</span></div>`;
  if(L.length > shown.length) h += `<p class="small">${L.length - shown.length} autres articles : précise la recherche.</p>`;
  el.innerHTML = h;
}

/* ---------- rendu : réglages ---------- */
function listEditor(id, arr){
  return `<div id="${id}">` + arr.map((s,i) => `<div class="grid4" style="margin-bottom:6px"><input type="text" data-l="${id}" data-i="${i}" data-f="name" value="${esc(s.name)}" aria-label="Nom"><input type="text" inputmode="decimal" class="num" data-l="${id}" data-i="${i}" data-f="q" value="${esc(s.q)}" aria-label="Quantité"><select data-l="${id}" data-i="${i}" data-f="u" aria-label="Unité"><option value="un" ${s.u==='un'?'selected':''}>un</option><option value="g" ${s.u==='g'?'selected':''}>g</option><option value="ml" ${s.u==='ml'?'selected':''}>ml</option></select><button class="btn s d" data-a="ldel" data-l="${id}" data-i="${i}" aria-label="Retirer">×</button></div><select data-l="${id}" data-i="${i}" data-f="r" aria-label="Rayon" style="margin-bottom:10px">${RAYONS.map(r=>`<option ${s.r===r?'selected':''}>${r}</option>`).join('')}</select>`).join('') + `<button class="btn s" data-a="ladd" data-l="${id}">Ajouter une ligne</button></div>`;
}
function histHtml(){
  if(!S.hist.length) return '<p class="small">Aucune semaine terminée pour l\'instant.</p>';
  const paid = S.hist.map(w => w.paid).filter(x => x>0), avg = paid.length ? paid.reduce((a,b) => a+b, 0)/paid.length : 0;
  return (avg ? `<p class="small">Moyenne payée : <b>${money(avg)}</b> sur ${paid.length} semaine${paid.length>1?'s':''}${S.p.budget ? `, pour un budget de ${money(S.p.budget)}` : ''}.</p>` : '')
    + S.hist.slice().reverse().slice(0,12).map(w => `<p class="small"><b>${esc(w.date)}</b>${w.paid ? ` (${money(w.paid)})` : ''} : ${histItems(w).map(x => esc(x.r)).join(', ')}</p>`).join('');
}
/* Prix de référence : date du relevé Maxi, comment les garder à jour */
function prixCard(){
  const nPerso = Object.values(S.prices||{}).filter(x => x && !x.sp).length, nVus = Object.keys(S.ph||{}).length;
  return `<div class="card"><h3>Prix de référence</h3>
    <p class="small">Les prix réguliers viennent de maxi.ca (${esc(PRIX_MAJ_TXT())}). Ils servent quand un article n'est pas en spécial.${prixVieux() ? ' <b class="over">Ce relevé date de plus de 4 mois : les prix ont probablement monté.</b>' : ''}</p>
    <p class="small">Ils se corrigent tout seuls avec tes données :</p>
    <ul class="todo small">
      <li><b>Prix payé</b> : dans Épicerie, touche le prix d'un article pour inscrire ce que tu as payé. Ce prix remplace celui de Maxi pour cet article. ${nPerso ? `(${nPerso} prix à toi)` : ''}</li>
      <li><b>Prix habituel</b> : dans Articles, inscris le prix régulier d'un article.</li>
      <li><b>Circulaires</b> : à chaque recherche, les spéciaux vus sont notés avec le prix habituel quand la circulaire indique le rabais. ${nVus ? `(${nVus} articles suivis)` : ''}</li>
    </ul>
    <p class="small">Pour refaire tout le relevé Maxi, demande à Claude de « mettre à jour les prix Maxi » : il relit maxi.ca et remplace le fichier prix-maxi.js du site.</p></div>`;
}
function backupCard(){
  const L = readCopies(), fmt = d => { try{ return new Date(d).toLocaleString('fr-CA', {day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'}); }catch(e){ return d; } };
  let res = ''; try{ res = localStorage.getItem(RESCUE) || ''; }catch(e){}
  const n = Object.keys(S.stock||{}).length, nr = (S.custom||[]).length, np = Object.keys(S.prices||{}).length;
  return `<div class="card" id="sauvegarde"><h3>Sauvegarde de mes données</h3>
    <p class="small">Tes données restent sur ce téléphone : ${n} article${n>1?'s':''} à la maison, ${nr} recette${nr>1?'s':''} à toi, ${np} prix noté${np>1?'s':''}, tes réglages et ton historique. Une mise à jour de l'application ne remplace que le code : tes données ne sont pas touchées.</p>
    ${res ? `<p class="note">Des données n'ont pas pu être lues et ont été mises de côté sans rien effacer. <button class="btn s" id="bk_rescue" data-armed="0">Essayer de les restaurer</button></p>` : ''}
    <p class="small"><b>Copies automatiques sur ce téléphone</b> : avant chaque mise à jour et une fois par jour, les 5 plus récentes. Elles protègent contre une erreur, mais pas si l'icône de l'application est supprimée.</p>
    ${L.length ? `<div class="list">${L.map((c,j) => `<div class="item"><span class="t"><b>${esc(c.label)}</b><small>${esc(fmt(c.d))}</small></span><button class="btn s" data-a="bk_restore" data-j="${j}" data-armed="0">Restaurer</button></div>`).join('')}</div>` : '<p class="small">Aucune copie pour l’instant.</p>'}
    <p class="small"><b>Copie dans Fichiers</b> : la seule qui survit si l'icône est supprimée ou si tu changes de téléphone. « Enregistrer dans Fichiers » ne remplace jamais l'ancienne copie : l'iPhone ajoute 2, 3, 4… au nom. Pour garder un seul fichier à jour, crée une fois le raccourci ci-dessous et choisis « Sauvegarde Menu » dans le partage. ${S.lastExport ? `Dernière copie : ${esc(fmtDate(S.lastExport))}.` : 'Aucune copie dans Fichiers pour l’instant.'}</p>
    <details class="panel"><summary>Créer le raccourci « Sauvegarde Menu » (une seule fois)</summary>
      <ol class="small steps-l">
        <li>Ouvre l'app Raccourcis, touche + et nomme le raccourci « Sauvegarde Menu ».</li>
        <li>Touche ⓘ (Détails) et active « Afficher dans la feuille de partage ». Dans le bloc « Recevoir… » en haut, garde seulement « Fichiers ».</li>
        <li>Ajoute l'action « Enregistrer le fichier ». Elle enregistre ce que le partage lui envoie.</li>
        <li>Dans cette action, désactive « Demander où enregistrer », choisis le dossier (iCloud Drive, par exemple) et active l'option qui écrase le fichier s'il existe déjà.</li>
        <li>Touche OK. Ensuite : « Sauvegarder », puis « Sauvegarde Menu » dans la liste du partage. Le fichier menu-semaine-sauvegarde.json est remplacé, sans numéro.</li>
      </ol>
      <p class="small">Les copies numérotées déjà créées peuvent être supprimées dans Fichiers. Pour restaurer, tu peux aussi toutes les choisir : l'application prend la plus récente.</p>
    </details>
    <label class="check"><input type="checkbox" data-pb="bkOpen" ${S.p.bkOpen!==false?'checked':''}> À chaque ouverture, proposer la sauvegarde s'il y a des changements</label>
    <div class="acts"><button class="btn s p" id="bk_file">Sauvegarder une copie</button><button class="btn s" id="bk_copy">Copier en texte</button></div>
    <label class="f">Restaurer une copie : choisis le fichier (ou plusieurs : la plus récente est prise), ou colle le texte<input type="file" id="bk_pick" multiple accept=".json,application/json,text/plain"></label>
    <textarea id="bk_txt" placeholder="Ou colle ici une copie en texte" aria-label="Sauvegarde"></textarea>
    <button class="btn s d" id="bk_imp" data-armed="0">Restaurer cette copie</button><div class="small" id="bk_msg"></div></div>`;
}
async function exportFile(){
  const prev = S.lastExport; S.lastExport = isoToday();
  const txt = JSON.stringify(S), name = 'menu-semaine-sauvegarde.json', msg = $('#bk_msg');
  const done = () => { S.lastExport = isoToday(); save(); S.bkDirty = false; bkBar = false; try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} render(); const m = $('#bk_msg'); if(m) m.textContent = 'Copie créée. Avec le raccourci « Sauvegarde Menu », elle remplace la précédente.'; };
  try{
    const f = new File([txt], name, {type:'application/json'});
    if(navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:'Sauvegarde Menu de la semaine'}); done(); return; }
  }catch(e){ if(e && e.name==='AbortError'){ S.lastExport = prev; return; } }
  try{ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type:'application/json'})); a.download = name; document.body.appendChild(a); a.click(); a.remove(); done(); }
  catch(e){ copier(txt, '#bk_msg'); }
}
function restoreFrom(raw, label){
  const o = JSON.parse(raw); if(!isObj(o) || !isObj(o.menu) || !isObj(o.stock)) throw new Error('invalide');
  const m = mergeState(o);   /* vérifie et complète AVANT de toucher aux données actuelles */
  if(!loadFailed && !snapshot('Avant la restauration', JSON.stringify(S))){ const e = $('#bk_msg'); if(e) e.textContent = "Espace plein : enregistre d'abord une sauvegarde dans Fichiers, puis réessaie."; throw Object.assign(new Error('espace'), {shown:true}); }
  const prev = S; S = m; S.appv = APPV;
  try{ render(); }catch(e){ S = prev; try{ save(); render(); }catch(_){} throw e; }   /* copie qui ne s'affiche pas : on revient aux données d'avant */
  loadFailed = false; save(); render();
  S.flash = label; const bm = $('#bk_msg'); if(bm) bm.textContent = label;
}
function renderReglages(){
  const p = S.p;
  let h = `<div class="card"><h3>Apparence</h3><div class="seg" role="group" aria-label="Apparence">${[['auto','Automatique'],['light','Claire'],['dark','Sombre']].map(([v,n]) => `<button class="${(p.theme||'auto')===v?'on':''}" data-a="theme" data-v="${v}">${n}</button>`).join('')}</div><p class="small">Automatique suit le téléphone : la carte crème le jour, l'ardoise le soir.</p></div>
    <div class="card"><h3>Menu</h3><div class="grid2">
    <label class="f">Déjeuners par semaine<select data-p="nDej">${[0,1,2,3,4,5,6,7].map(n=>`<option ${(p.nDej||0)===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Dîners par semaine<select data-p="nDin">${[0,1,2,3,4,5,6,7].map(n=>`<option ${(p.nDin||0)===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Soupers par semaine<select data-p="n">${[3,4,5,6,7].map(n=>`<option ${p.n===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Entrées par semaine<select data-p="nEnt">${[0,1,2,3,4,5,6,7].map(n=>`<option ${(p.nEnt||0)===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Soupes et potages par semaine<select data-p="nSou">${[0,1,2,3].map(n=>`<option ${(p.nSou||0)===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Desserts par semaine<select data-p="nDes">${[0,1,2,3,4,5,6,7].map(n=>`<option ${(p.nDes||0)===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Sans répéter (semaines)<select id="p_cool">${[1,2,3,4,5,6,8].map(n=>`<option ${p.cool===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Variantes<select id="p_var"><option value="alt" ${p.varMode==='alt'?'selected':''}>Alterner avec la base</option><option value="var" ${p.varMode==='var'?'selected':''}>Toujours une variante</option><option value="base" ${p.varMode==='base'?'selected':''}>Recette de base</option></select></label>
    <label class="f">Portions au souper<select id="p_sou">${[3,4,5,6,7,8].map(n=>`<option ${p.souper===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Portions de restes (dîner du lendemain)<select id="p_res">${[0,1,2,3,4,5].map(n=>`<option ${p.restes===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Portions au déjeuner<select data-p="pDej"><option value="0" ${!p.pDej?'selected':''}>Auto (${p.souper||4})</option>${[1,2,3,4,5,6,7,8,10].map(n=>`<option ${p.pDej===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Portions d'un dîner cuisiné<select data-p="pDin"><option value="0" ${!p.pDin?'selected':''}>Auto (${p.restes > 0 ? p.restes : (p.souper||4)})</option>${[1,2,3,4,5,6,7,8,10].map(n=>`<option ${p.pDin===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Préparation max. en semaine<select id="p_tm">${[20,30,35,45,60].map(n=>`<option value="${n}" ${p.maxTm===n?'selected':''}>${n} min</option>`).join('')}</select></label>
    <label class="f">Soupers plus longs (congé, fin de semaine)<select id="p_lg">${[0,1,2,3].map(n=>`<option ${p.nLong===n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Jours de collations<select id="p_j">${[1,2,3,4,5,6,7].map(n=>`<option ${p.jours===n?'selected':''}>${n}</option>`).join('')}</select></label></div></div>
    <div class="card"><h3>Organisation de la semaine</h3>
      <p class="small">Jours de congé : les soupers longs à préparer et le fumoir y sont placés. En semaine, seule la préparation compte : le four sans surveillance (jusqu'à 1 h 30) et la mijoteuse sont permis.</p>
      <div class="chips">${[1,2,3,4,5,6,0].map(d => `<label class="chip"><input type="checkbox" data-off="${d}" ${(p.off||[0,6]).includes(d)?'checked':''}>${cap(JOURS[d])}</label>`).join('')}</div>
      <p class="small">Déjeuners : les jours de congé, un déjeuner cuisiné; les jours de travail, un déjeuner de semaine (céréales, rôties, gruau, yogourt…). Pour en avoir tous les jours, mets 7 dans « Déjeuners par semaine ».</p>
      <label class="check"><input type="checkbox" data-pb="desSimple" ${p.desSimple?'checked':''}> Desserts : proposer aussi les simples (fruits, crème glacée, desserts du commerce). Sinon, seulement des desserts faits maison.</label>
      <label class="check"><input type="checkbox" data-pb="dinRestes" ${p.dinRestes!==false?'checked':''}> Dîners : manger d'abord les restes du souper de la veille. Les jours sans restes, un plat de la banque des soupers (différent de ceux de la semaine).</label>
      <label class="check"><input type="checkbox" data-pb="reste" ${p.reste!==false?'checked':''}> Cuisiner une fois, manger deux fois : jumeler les grosses pièces (épaule de jambon, poulet entier…) à un plat qui utilise les restes</label>
      <label class="f">Plats préparés (pizza, lasagne surgelées…)<select data-ps="pp">${[['spec','Les mettre au menu quand ils sont en spécial (1 par semaine)'],['sugg','Seulement les suggérer quand ils sont en spécial'],['all','Comme les autres plats'],['never','Jamais']].map(([v,n]) => `<option value="${v}" ${(p.pp||'spec')===v?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="f">Budget d'épicerie par semaine ($, 0 si aucun)<input type="text" inputmode="decimal" class="num" data-p="budget" value="${p.budget||0}"></label></div>
    <div class="card"><h3>Mes épiceries</h3><p class="small">La recherche des spéciaux ne lit que les circulaires des épiceries cochées. Sur la carte de la semaine (Menu), « Cette semaine, je fais l'épicerie » permet de n'en garder qu'une, par exemple pour une commande en ligne.</p>
      <label class="f">Code postal<input type="text" data-cp="1" value="${esc(S.cp)}" autocapitalize="characters" placeholder="A1A 1A1"></label>
      ${storePicker()}
      <label class="f">Épicerie principale (pour la liste par magasin)<select data-ps="main"><option value="">La première cochée${S.stores[0] ? ' ('+esc(S.stores[0])+')' : ''}</option>${(S.stores.length ? S.stores : allStores()).map(s => `<option ${p.main===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label></div>
    <div class="card"><h3>Mes collations, par jour</h3><p class="small">Multipliées par le nombre de jours, ajoutées à chaque liste.</p>${listEditor('snacks',S.snacks)}
      <label class="check"><input type="checkbox" data-pb="snk" ${S.p.snk!==false?'checked':''}> Suggérer des collations en spécial (carte « Collations en spécial » du Menu)</label></div>
    <div class="card"><h3>Déjeuners, lunchs, collations et boissons</h3><p class="small">Tout ce que la famille achète chaque semaine, hors souper. Quantité pour la semaine : si un article dure plus longtemps (confiture, beurre d'arachide), baisse-le à 0 ou ajuste le stock dans Maison.</p>${listEditor('ess',S.ess)}${S.ess.length?'':'<button class="btn s" id="ess_preset">Ajouter la liste suggérée</button>'}</div>
    <div class="card"><h3>Toujours à la maison</h3><p class="small">Séparés par des virgules. Ils ne vont pas dans la liste : ils s'affichent dans « Vérifier avant de partir ».</p><textarea id="maison">${esc(S.maison)}</textarea></div>
    <div class="card"><h3>Historique</h3>${histHtml()}
    ${S.hist.length?'<button class="btn s d" id="hclr" data-armed="0">Effacer l\'historique</button>':''}</div>
    ${prixCard()}
    ${backupCard()}
    <p class="small" style="text-align:center">Version de l'application : ${esc(APPV)}</p>
    <div class="card"><h3>Tout remettre à zéro</h3><p class="small">Efface le menu, le stock et l'historique.</p><button class="btn s d" id="reset" data-armed="0">Réinitialiser</button></div>`;
  $('#tab-reglages').innerHTML = h;
}

/* ---------- navigation et rendu global ---------- */
let tab = 'menu';
/* Apparence : claire par défaut, sombre ou comme le téléphone au choix (Réglages). */
function applyTheme(){
  const t = (S.p && S.p.theme) || 'auto', root = document.documentElement;
  if(t==='auto') delete root.dataset.theme; else root.dataset.theme = t;
  const dark = t==='dark' || (t==='auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  const m = document.getElementById('mtc'); if(m) m.content = dark ? '#1c1917' : '#f6eee0';
}
/* plats supprimés ou versions retirées : on nettoie les références au lieu de planter l'affichage */
function fixRefs(){
  let ch = false;
  const ok = it => { if(!it || typeof it.r!=='string') return false; const r = byName(it.r); if(!r) return false; if(it.v && !(vars(r)[it.v-1])){ it.v = 0; ch = true; } return true; };
  LISTS.forEach(l => { const L = S.menu[l]; if(Array.isArray(L)){ const K = L.filter(ok); if(K.length !== L.length){ S.menu[l] = K; ch = true; } } });
  if(S.occ && Array.isArray(S.occ.items)){ const K = S.occ.items.filter(ok); if(K.length !== S.occ.items.length){ S.occ.items = K; ch = true; } }
  return ch;
}
function render(){
  applyTheme();
  _AR = _ND = _BL = _AS = _PN = null; _DF = new Map(); _ASA = null; _ECO = new Map(); _CMP = new Map();
  if(fixRefs() | syncMeals()) save();
  ({menu:renderMenu, epicerie:renderEpicerie, articles:renderArticles, maison:renderMaison, recettes:renderRecettes, reglages:renderReglages, aide:renderAide})[tab]();
  ['menu','epicerie','articles','maison','recettes','reglages','aide'].forEach(t => $('#tab-'+t).hidden = t!==tab);
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t===tab));
  const n = S.menu.date ? buyList().rows.filter(r => !S.menu.chk[r.k]).length : 0;
  const bg = $('#bgl'); bg.hidden = !n; bg.textContent = n;
  if(cook) renderCook();
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; tab = b.dataset.t; render(); window.scrollTo(0,0); });

/* ---------- actions ---------- */
function arm(btn, label, fn){
  if(btn.dataset.armed==='1'){ fn(); return; }
  btn.dataset.armed='1'; const old = btn.textContent; btn.textContent = label;
  setTimeout(() => { if(btn.isConnected){ btn.dataset.armed='0'; btn.textContent = old; } }, 3500);
}
function terminerSemaine(){
  /* articles cochés au magasin sans avoir touché « Épicerie terminée » : on les compte quand même dans Maison */
  if(!S.menu.achete && Object.values(S.menu.chk||{}).some(Boolean)) epicerieFaite();
  needs().forEach(n => {
    if(isMaison(n.name)) return;
    const sk = stockKey(n); const st = sk ? S.stock[sk] : null; if(!st) return;
    st.q = Math.max(0, st.q - n.q); if(st.q <= 0.001) delete S.stock[sk];
  });
  S.hist.push({date:S.menu.date, items:S.menu.items.map(x => ({r:x.r, v:x.v, sf:x.sf||'', sv:x.sv||''})), din:mlist('din').map(x => ({r:x.r, v:x.v, sf:x.sf||'', sv:x.sv||''})), dej:mlist('dej').map(x => ({r:x.r, v:x.v})), ent:mlist('ent').map(x => ({r:x.r, v:x.v})), sou:mlist('sou').map(x => ({r:x.r, v:x.v})), des:mlist('des').map(x => ({r:x.r, v:x.v})), paid:S.menu.paid||0});
  S.hist = S.hist.slice(-26);
  S.menu = {date:'', items:(S.report||[]).map(x => Object.assign({}, x, {lock:true, rep:true})), din:[], dej:[], dinCook:{}, dinNo:{}, dsel:{}, ent:[], sou:[], des:[], chk:{}, extra:{}, achete:false, snap:null, useup:{}};
  S.report = [];
  S.spec = [];
  save(); tab = 'menu'; render(); window.scrollTo(0,0);
}
function epicerieFaite(){
  const {rows} = buyList();
  rows.forEach(r => {
    if(!S.menu.chk[r.k]) return;
    const q = Math.max(r.buy, r.def||0), o = S.stock[r.k]; if(o) o.q += q; else S.stock[r.k] = {name:r.name, u:r.u, q, rayon:r.rayon};
  });
  S.menu.snap = (S.menu.snap||[]).filter(x => x.ok).concat(rows.map(r => ({name:r.name, u:r.u, buy:r.buy, ok:!!S.menu.chk[r.k]})));
  S.menu.chk = {}; S.menu.extra = {}; S.menu.achete = true; storeMode = false; save(); render();
}
function ajouterSpeciaux(){
  const store = $('#spstore').value; const lines = $('#sptxt').value.split(/\n+/).map(x => x.trim()).filter(x => x.length>=4 && x.length<=140);
  const mots = new Set(allRecipes().flatMap(r => (r.m||[]).map(norm)));
  const keep = lines.filter(l => { const n = norm(l); return [...mots].some(m => m.length>=4 && n.includes(m)); });
  const known = new Set(S.spec.map(s => s.s+'|'+norm(s.t)));
  let added = 0;
  keep.forEach(l => { const k = store+'|'+norm(l); if(!known.has(k)){ S.spec.push({s:store, t:l}); added++; } });
  S.spec = S.spec.slice(-120);
  save(); render();
  const msg = $('#spmsg'); if(msg) msg.textContent = `${added} spéciaux retenus sur ${lines.length} lignes.`;
}

document.addEventListener('click', e => {
  const t = e.target.closest('[id],[data-a]'); if(!t) return;
  /* un menu déroulant ou un champ texte se gère à « change » : redessiner au toucher fermerait le menu sur iPhone */
  if(t.tagName==='SELECT' || t.tagName==='OPTION' || t.tagName==='TEXTAREA' || (t.tagName==='INPUT' && !/^(checkbox|radio|button|submit)$/.test(t.type))) return;
  const a = t.dataset.a, id = t.id;
  if(id==='cook' && !a) return;   /* un toucher dans le mode Cuisiner, hors bouton */
  if(a==='cook'){ e.preventDefault(); if(t.dataset.r) openCook({r:t.dataset.r}); else openCook({l:t.dataset.ml||'items', i:+t.dataset.i}); return; }
  if(a==='ck_close'){ closeCook(); return; }
  if(a==='resto'){ const td = isoToday(), w = t.dataset.m; let msg = '';
    if(w==='soir'){ const i = mlist('items').findIndex(x => x.d===td); if(i>=0) msg = reportTomorrow(i); }
    else if(w==='matin'){ const i = mlist('dej').findIndex(x => x.d===td); if(i>=0) msg = reportDej(i); }
    else msg = restoMidi(td);
    if(msg){ S.flash = msg; save(); render(); const fm = $('#flash'); if(fm){ fm.textContent = msg; fm.hidden = false; } window.scrollTo(0, 0); } return; }
  if(a==='ck_reset'){ if(cook){ const o = ckRead(); delete o[cook.key]; ckWrite(o); renderCook(); } return; }
  if(id==='setup_done'){ S.setup = true; const c = $('#su_ess'); if(c && c.checked && !S.ess.length) S.ess = ESS_START(); save(); render(); window.scrollTo(0,0); return; }
  if(id==='ess_preset'){ S.ess = ESS_START(); save(); render(); return; }
  if(id==='gen'){ if(S.menu.date && t.dataset.armed!=='1'){ arm(t,'Confirmer', ()=>{}); return; } genMenu(); return; }
  if(id==='addbtn'){ const r = byName($('#addsel').value); if(r){ addToMenu(r); save(); render(); } return; }
  if(id==='fin'){ arm(t,'Confirmer : terminer la semaine', terminerSemaine); return; }
  if(id==='achete'){ arm(t, Object.values(S.menu.chk||{}).some(Boolean) ? 'Confirmer : épicerie terminée' : 'Rien de coché : confirmer quand même ?', epicerieFaite); return; }
  if(id==='spadd'){ ajouterSpeciaux(); return; }
  if(id==='spclr'){ S.spec = []; save(); render(); return; }
  if(id==='hclr'){ arm(t,'Confirmer', () => { S.hist = []; save(); render(); }); return; }
  if(id==='reset'){ arm(t,'Confirmer : tout effacer', () => { if(!snapshot('Avant la remise à zéro', JSON.stringify(S))){ setSync("Espace plein : enregistre d'abord une sauvegarde dans Fichiers (Réglages)."); return; } S = DEFAULT(); S.appv = APPV; loadFailed = false; rescued = false; save(); render(); }); return; }
  if(id==='help_btn'||id==='help_open'){ tab='aide'; S.help=true; save(); render(); window.scrollTo(0,0); return; }
  if(id==='help_hide'){ S.help=true; save(); render(); return; }
  if(id==='help_back'){ tab='menu'; render(); window.scrollTo(0,0); return; }
  if(id==='sp_go'){ chercherSpeciaux(false); return; }
  if(id==='bfit'){ const n = budgetFit(); S.flash = n ? `${n} souper${n>1?'s':''} remplacé${n>1?'s':''} par ${n>1?'des plats moins chers':'un plat moins cher'}.` + (listTotals(buyList().rows).cost > (+S.p.budget||0) ? ' Le budget est encore dépassé : verrouille moins de plats, baisse les portions ou retire des articles.' : '') : "Aucun plat moins cher ne convient (plats verrouillés, déjà faits récemment ou exclus). Essaie de baisser les portions ou de retirer des articles."; save(); render(); const fm = $('#flash'); if(fm){ fm.textContent = S.flash; fm.hidden = false; } else setSync(S.flash); return; }
  if(id==='st_find'){ trouverEpiceries(); return; }
  if(id==='stx_add'){ const n = String(($('#stx_n')||{}).value||'').trim().replace(/\s+/g,' '); if(!n) { say($('#st_msg'), "Écris le nom de l'épicerie."); return; }
    const known = marchand(n) && STORES.includes(marchand(n)) ? marchand(n) : '';
    if(known){ if(!S.stores.includes(known)) S.stores.push(known); }
    else { S.storesx = S.storesx||[]; if(!S.storesx.some(s => norm(s)===norm(n))) S.storesx.push(n); if(!S.stores.includes(n)) S.stores.push(n); }
    save(); render(); say($('#st_msg'), known ? `${known} est déjà dans la liste : elle est maintenant cochée.` : `${n} ajoutée et cochée. Ses spéciaux seront lus si Flipp a sa circulaire pour ton code postal.`); return; }
  if(id==='nr_save'){ saveRecette(); return; }
  const mx = id.match(/^(x[me]_)([lmd])_copy$/);
  if(mx){ copier(({l:texteListe,m:texteMenu,d:texteDetail})[mx[2]](), '#'+mx[1]+'msg'); return; }
  if(id==='ns_save'){ saveSide(); return; }
  if(id==='store_on'){ storeMode = true; lockScreen(true); render(); window.scrollTo(0,0); return; }
  if(id==='store_off'){ storeMode = false; lockScreen(false); render(); window.scrollTo(0,0); return; }
  if(id==='imp_go'){ const txt = $('#imp_txt').value, res = importRecipes(txt);
    if(res.added || res.skipped){ if(res.added) save(); render(); const mm = $('#imp_msg');
      if(mm) mm.textContent = res.added ? `${res.added} recette${res.added>1?'s':''} importée${res.added>1?'s':''} : ${res.names.join(', ')}.` : 'Ces recettes sont déjà dans ta banque.'; return; }
    const w = parseWebRecipe(txt);
    if(!w){ const mm = $('#imp_msg'); if(mm) mm.textContent = "Aucune recette trouvée dans ce texte. Copie la recette au complet, avec la liste des ingrédients (un par ligne) et la préparation."; return; }
    webToDraft(w); openRec.add('__new'); openRec.delete('__imp'); rf = Object.assign(rf, {q:''}); render();
    const box = document.querySelector('details[data-rec="__new"]'); if(box) box.scrollIntoView({block:'start'});
    drafts.new.note = `Recette lue : ${w.rows.length} ingrédient${w.rows.length>1?'s':''}${w.portions && w.k==='souper' ? `, ajustés de ${w.portions} à 6 portions` : ''}${w.unsure.length ? `. Quantité à vérifier : ${w.unsure.join(', ')}` : ''}. Vérifie les noms, les quantités, le genre et le temps, puis touche « Enregistrer la recette » en bas.`; render(); const box2 = document.querySelector('details[data-rec="__new"]'); if(box2) box2.scrollIntoView({block:'start'}); return; }
  if(id==='go_liste'){ tab='epicerie'; render(); window.scrollTo(0,0); return; }
  if(id==='bk_copy'){ copier(JSON.stringify(S), '#bk_msg').then(ok => { if(ok){ S.lastExport = isoToday(); save(); } }); return; }
  if(id==='bk_file'){ exportFile(); return; }
  if(id==='bk_imp'){ arm(t,'Confirmer : remplacer mes données', () => {
      try{ restoreFrom($('#bk_txt').value, 'Copie restaurée. Tes données d\'avant sont gardées dans les copies automatiques.'); }
      catch(e){ const m = $('#bk_msg'); if(m && !e.shown) m.textContent = "Cette copie n'est pas valide. Rien n'a été changé."; t.dataset.armed='0'; t.textContent='Restaurer cette copie'; } }); return; }
  if(id==='bk_rescue'){ arm(t,'Confirmer : restaurer', () => { try{ restoreFrom(localStorage.getItem(RESCUE), 'Données restaurées.'); localStorage.removeItem(RESCUE); }catch(e){ const m = $('#bk_msg'); if(m) m.textContent = "Ces données n'ont pas pu être lues. Elles restent gardées."; } }); return; }
  if(id==='aadd'){
    const name = plain($('#an').value), am0 = $('#amsg'); let q = parseFloat(String($('#aq').value).replace(',','.')), u = $('#au').value;
    if(!name){ if(am0) am0.textContent = 'Choisis ou tape un aliment.'; return; }
    if(!(q>0)){ if(am0) am0.textContent = 'Indique une quantité plus grande que 0.'; return; }
    if((u==='g' || u==='ml') && q < 20 && t.dataset.sure!==String(q)+u){ t.dataset.sure = String(q)+u; if(am0) am0.textContent = `${String(q).replace('.',',')} ${u}, c'est très peu. Si tu voulais dire ${String(q).replace('.',',')} ${u==='g'?'kg':'L'} ou ${String(q).replace('.',',')} paquets, change l'unité. Sinon, touche encore « Ajouter à la maison ».`; return; }
    [q,u] = toBase(q,u); [q,u] = normQU(name,q,u);
    const k = keyOf(name,u); const o = S.stock[k];
    const cat = $('#acat').value; if(o){ o.q += q; if(cat) o.cat = cat; } else S.stock[k] = {name, u, q, rayon:$('#ar').value, cat};
    save(); render(); const am = $('#amsg'); if(am) am.textContent = name+' ajouté. La prochaine planification en tient compte.'; return;
  }
  if(!a) return;
  const i = +t.dataset.i;
  const ml = t.dataset.ml;
  if(ml){
    const L = mlist(ml), it = L[i]; if(!it) return;
    const r = byName(it.r);
    if(a==='mexing') e.preventDefault();
    if(a==='mcopy'){ copier(texteRecette(it,i,true), '#rmsg_'+ml+'_'+i); return; }
    if(a==='rep1' || a==='repw'){ const msg = a==='rep1' ? reportTomorrow(i) : reportWeek(i); S.flash = msg; save(); render(); const fm = $('#flash'); if(fm){ fm.textContent = msg; fm.hidden = !msg; } return; }
    if(a==='dinrest' || a==='dinno'){ const d = it.d; L.splice(i, 1); if(d){ if(a==='dinrest') delete (S.menu.dinCook||{})[d]; else (S.menu.dinNo = S.menu.dinNo||{})[d] = true; } save(); render(); return; }
    if(a==='mlock') it.lock = !it.lock;
    else if(a==='mrm'){ L.splice(i,1); L.forEach(x => { if(x.after===it.r) delete x.after; }); }
    else if(a==='mswap' || a==='mdis'){
      if(a==='mdis') S.dis[it.r] = true;
      const d0 = it.d, keep = L.filter((_,j) => j!==i); keep.forEach(x => { if(x.after===it.r) delete x.after; });
      const nl = fill(L.length, keep, ml, new Set([it.r])); if(nl.length > keep.length && d0) nl[nl.length-1].d = d0; S.menu[ml] = nl; }
    else if(a==='mup' || a==='mdown'){ const v = a==='mup' ? 'up' : 'down', rt = S.rate[it.r] = S.rate[it.r] || {up:0, down:0};
      if(it.rt) rt[it.rt] = Math.max(0, rt[it.rt]-1); it.rt = it.rt===v ? '' : v; if(it.rt) rt[it.rt]++; }
    else if(a==='mexing'){ it.ex = it.ex||[]; const k = t.dataset.k, p = it.ex.indexOf(k); if(p>=0) it.ex.splice(p,1); else it.ex.push(k); }
    else if(a==='msetv'){
      const nv = +t.dataset.v; it.v = nv;
      if((ml==='items' || ml==='din') && r){ const old = it.ovr||{}, ov = variantSides(r,nv), used = usedSides(L.filter((_,j) => j!==i));
        ['f','v'].forEach(sl => { const key = sl==='f'?'sf':'sv'; if(sl in ov) it[key] = ov[sl]; else if(old[sl]) it[key] = chooseSide(r,sl,used); });
        it.ovr = {f:'f' in ov, v:'v' in ov}; }
    }
    else if(a==='mreroll' && r){ const used = usedSides(L.filter((_,j) => j!==i)), ov = variantSides(r,it.v); delete it.man;
      it.sf = 'f' in ov ? ov.f : chooseSide(r,'f',used); used.add(it.sf); it.sv = 'v' in ov ? ov.v : chooseSide(r,'v',used); }
    if(ml==='items') assignDays(false);
    save(); render(); return;
  }
  if(a==='radd'){ pick = {q:'', r:t.dataset.r, v:+t.dataset.v||0}; openPan.add('pick'); tab = 'menu'; render(); const pc = document.querySelector('details.pick'); if(pc) pc.scrollIntoView({block:'start'}); return; }
  if(a==='pk_pick'){ pick = {q:pick.q, r:t.dataset.r, v:+t.dataset.v||0, meal:pick.meal, d:pick.d}; render(); const pc = document.querySelector('details.pick'); if(pc) pc.scrollIntoView({block:'start'}); return; }
  if(a==='pk_cancel'){ pick = {q:'', r:'', v:0}; render(); return; }
  if(a==='pk_add'){ addPicked(); return; }
  if(a==='unrep'){ const x = (S.report||[]).splice(+t.dataset.j, 1)[0]; if(x){ const it = Object.assign({}, x, {lock:true}); mlist('items').push(it); assignDays(false); S.flash = `${x.r} est remis au menu de cette semaine.`; } save(); render(); return; }
  if(a==='oc_add'){ const r = byName(t.dataset.r); if(r){ const x = {r:r.n, v:+t.dataset.v||0}; if(kindOf(r)==='souper'){ const it = mkItem(r, new Set(), x.v); x.sf = it.sf; x.sv = it.sv; } occ().items.push(x); openPan.add('occ'); save(); render(); const oc = document.querySelector('details[data-pan=occ]'); if(oc) oc.scrollIntoView({block:'start'}); } return; }
  if(a==='occ_rm'){ occ().items.splice(+t.dataset.j, 1); save(); render(); return; }
  if(a==='occ_clear'){ occ().items = []; save(); render(); return; }
  if(a==='occ_copy'){ copier(occText(), '#occ_msg'); return; }
  if(a==='occ_menu'){ occToMenu(); save(); render(); window.scrollTo(0,0); return; }
  if(a==='sdis'){ S.sdis = S.sdis||{}; if(S.sdis[t.dataset.id]) delete S.sdis[t.dataset.id]; else S.sdis[t.dataset.id] = true; openRec.add('side|'+t.dataset.id); save(); render(); return; }
  if(a==='sdel2'){ arm(t, 'Confirmer', () => { S.sidesx = (S.sidesx||[]).filter(x => x.id!==t.dataset.id); save(); render(); }); return; }
  if(a==='bk_restore'){ const c = readCopies()[+t.dataset.j]; if(c) arm(t, 'Confirmer', () => { try{ restoreFrom(c.data, `Copie du ${new Date(c.d).toLocaleDateString('fr-CA', {day:'numeric', month:'long'})} restaurée.`); }catch(e){ const m = $('#bk_msg'); if(m && !e.shown) m.textContent = "Cette copie n'a pas pu être lue. Rien n'a été changé."; } }); return; }
  if(a==='bk_go'){ tab = 'reglages'; render(); const c = document.getElementById('sauvegarde'); if(c) c.scrollIntoView({block:'start'}); return; }
  if(a==='bk_hide'){ bkBar = false; render(); return; }
  if(a==='bk_later'){ S.bkSnooze = addDays(isoToday(), 14); save(); render(); return; }
  if(a==='theme'){ S.p.theme = t.dataset.v; save(); render(); return; }
  if(a==='stx_rm'){ e.preventDefault(); const s = t.dataset.s; S.storesx = (S.storesx||[]).filter(x => x!==s); S.stores = S.stores.filter(x => x!==s); save(); render(); return; }
  if(a==='ar_go'){ e.preventDefault(); const b = t.dataset.b; tab = 'articles'; artF = {q:'', f:'week'}; openPan.add('art|'+b); render(); const d = document.querySelector(`details.art[data-b="${CSS.escape(b)}"]`); if(d) d.scrollIntoView({block:'start'}); return; }
  if(a==='ar_f'){ artF.f = t.dataset.v; renderArticles(); return; }
  if(a==='ar_unex'){ const b = t.dataset.b, A = (S.art||{})[b]; if(A) delete A.ex; openPan.add('art|'+b); save(); render(); return; }
  if(a==='ar_ex'){ const b = t.dataset.b, s = allSpec().find(x => spId(x)===t.dataset.id); if(s){ const A = (S.art||{})[b] || {}; artSet(b, {n:t.dataset.n, ex:[...new Set((A.ex||[]).concat(norm(s.t)))].slice(-60)}); if(S.menu.dsel && S.menu.dsel[b]===t.dataset.id) delete S.menu.dsel[b]; } openPan.add('art|'+b); save(); render(); return; }
  if(a==='ar_pick' || a==='ar_none' || a==='ar_auto' || a==='ar_spick'){ const b = t.dataset.b; S.menu.dsel = S.menu.dsel || {};
    if(a==='ar_none') S.menu.dsel[b] = 'none'; else if(a==='ar_auto') delete S.menu.dsel[b];
    else { S.menu.dsel[b] = t.dataset.id;
      if(a==='ar_spick' && t.dataset.v==='a'){ const s = allSpec().find(x => spId(x)===t.dataset.id); if(s){ const tk = toks(s.t, true).slice(0, 6), A = (S.art||{})[b] || {}; if(tk.length && !(A.learn||[]).some(x => x.join(' ')===tk.join(' '))) artSet(b, {n:t.dataset.n, learn:(A.learn||[]).concat([tk])}); } }
      delete artSq[b]; }
    openPan.add('art|'+b); save(); render(); return; }
  if(a==='ar_unlearn'){ e.preventDefault(); artSet(t.dataset.b, {learn:[]}); save(); render(); return; }
  if(a==='ar_reset'){ const b = t.dataset.b; delete (S.art||{})[b]; if(S.menu.dsel) delete S.menu.dsel[b]; delete (S.prices||{})[keyOf(t.dataset.n, t.dataset.u)]; save(); render(); return; }
  if(a==='goadd'){ const s = t.dataset.s; S.skip = (S.skip||[]).filter(x => x!==s); S.goSome = false; save(); render(); return; }
  if(a==='dincook'){ const d = t.dataset.d; S.menu.dinCook = Object.assign(S.menu.dinCook||{}, {[d]:true}); save(); render(); return; }
  if(a==='pk_meal'){ pick.meal = t.dataset.v; render(); return; }
  if(a==='din_add'){ pick = {q:'', r:'', v:0, meal:'din', d:t.dataset.d}; openPan.add('pick'); render(); const pc = document.querySelector('details.pick'); if(pc){ pc.scrollIntoView({block:'start'}); const q = $('#pk_q'); if(q) q.focus(); } return; }
  if(a==='aubadd'){ const s = allSpecAll().find(x => x.t===t.dataset.t); if(s){ S.menu.sn = S.menu.sn||[]; S.menu.sn.push({t:s.t, p:s.p, s:s.s, name:s.t, q:1, u:'un', r:guessRayon(s.t), src:'Réserves (aubaine)'}); save(); render(); } return; }
  if(a==='pr_edit'){ e.preventDefault(); prEdit = t.dataset.k; render(); const inp = document.querySelector('input.prin'); if(inp) inp.focus(); return; }
  if(a==='snadd'){ const s = allSpec().find(x => x.t===t.dataset.t); if(s){ S.menu.sn = S.menu.sn||[]; S.menu.sn.push({t:s.t, p:s.p, s:s.s, name:s.t, q:1, u:'un', r:guessRayon(s.t)}); save(); render(); } return; }
  if(a==='snrm'){ (S.menu.sn||[]).splice(+t.dataset.i, 1); save(); render(); return; }
  if(a==='ib_add' || a==='ib_rm'){ const d = drafts[t.dataset.ib]; if(d){ if(a==='ib_add') d.rows.push({n:'', q:'', u:'un', ray:''}); else { d.rows.splice(+t.dataset.j,1); if(!d.rows.length) d.rows.push({n:'', q:'', u:'un', ray:''}); } render(); } return; }
  if(a==='ib_pick'){ const d = drafts[t.dataset.ib], x = d && d.rows[+t.dataset.j], c = catFind(t.dataset.c); if(x && c){ x.n = c.n; x.u = c.u; x.ray = c.ray; const w = t.closest('.ibw'); w.querySelector('.ib_n').value = c.n; w.querySelector('.ib_u').value = c.u; w.querySelector('.sugg').innerHTML = ''; w.querySelector('.ib_rw').innerHTML = ''; w.querySelector('.ib_q').focus(); } return; }
  if(a==='an_pick'){ anFill(catFind(t.dataset.c)); const q = $('#aq'); if(q){ q.focus(); q.select(); } return; }
  if(a==='an_ray'){ anRay = anRay===t.dataset.r ? '' : t.dataset.r; openPan.add('an_browse'); renderMaison(); return; }
  if(a==='grp'){ S.p.grp = t.dataset.v; save(); render(); return; }
  if(a==='rdis'){ const n = t.dataset.r; if(S.dis[n]) delete S.dis[n]; else S.dis[n] = true; save(); render(); return; }
  if(a==='vsave' || a==='vrm' || a==='vadd' || a==='vrestore' || a==='rsave' || a==='rreset'){
    const n = t.dataset.r, r = byName(n); if(!r) return;
    const before = varRows(r).map(x => x.v);   /* pour garder la bonne version aux plats déjà au menu */
    if(a==='vrestore'){ e.preventDefault(); delete S.vared[n]; delete S.vardel[n]; Object.keys(drafts).forEach(k => { if(k.startsWith('va|'+n+'|')) delete drafts[k]; }); }
    else if(a==='rsave'){ saveRecEdit(t); return; }
    else if(a==='rreset'){ delete S.redit[n]; delete drafts['edit|'+n]; }
    else if(a==='vrm'){ if(t.dataset.armed!=='1'){ arm(t,'Confirmer', ()=>{}); return; }
      const ix = +t.dataset.i; if(t.dataset.s==='b') (S.vardel[n] = S.vardel[n]||[]).push(ix); else S.varx[n].splice(ix,1); Object.keys(drafts).forEach(k => { if(k.startsWith('va|'+n+'|')) delete drafts[k]; }); }
    else { const key = t.dataset.key, res = varFromDraft(key); if(res.err){ say(t.closest('.vbox').querySelector('.ve_msg'), res.err); return; }
      const val = res.val;
      if(a==='vadd') (S.varx[n] = S.varx[n]||[]).push(val);
      else if(t.dataset.s==='b') (S.vared[n] = S.vared[n]||{})[+t.dataset.i] = val;
      else S.varx[n][+t.dataset.i] = val;
      delete drafts[key]; openPan.delete(key); }
    remapV(n, before, a); openRec.add(n); save(); render(); return;
  }
  if(a==='gorec'){ e.preventDefault(); tab='recettes'; openRec.add('__new'); render(); window.scrollTo(0,0); }
  else if(a==='rshare2'){ const r = byName(t.dataset.r); const fx = x => x==='auto' ? '' : (x||''); copier(texteRecette({r:r.n, v:0, sf:fx(r.sf), sv:fx(r.sv)}, 0, true), '#rm2_'+t.dataset.x); }
  else if(a==='eat'){ const k = t.dataset.k; if(S.menu.useup[k]) delete S.menu.useup[k]; else S.menu.useup[k] = true; save(); render(); }
  else if(a==='addrec'){ const r = byName(t.dataset.r); if(r){ addToMenu(r); save(); render(); } }
  else if(a==='keepside'){ const o = S.stock[t.dataset.k]; if(o && !(S.sidesx||[]).some(s => norm(s.n)===norm(o.name))){ (S.sidesx = S.sidesx||[]).push({id:'x'+Date.now().toString(36), n:o.name, sl:o.cat, ty:['all'], i:[[Math.max(1,o.q), o.u, o.name, o.rayon||'épicerie']]}); save(); render(); const am = $('#amsg'); if(am) am.textContent = o.name+' est maintenant un accompagnement permanent (voir Recettes).'; } }
  else if(a==='fav'){ if(S.fav[t.dataset.r]) delete S.fav[t.dataset.r]; else S.fav[t.dataset.r] = true; openRec.add(t.dataset.r); save(); render(); }
  else if(a==='sdel'){ e.preventDefault(); arm(t, 'confirmer ?', () => { S.sidesx = (S.sidesx||[]).filter(x => x.id!==t.dataset.id); save(); render(); }); }
  else if(a==='rdel'){ arm(t,'Confirmer', () => { S.custom = S.custom.filter(r => r.n!==t.dataset.r); delete S.varx[t.dataset.r]; openRec.delete(t.dataset.r); save(); render(); }); }
  else if(a==='spdel'){ e.preventDefault(); S.spec.splice(i,1); save(); render(); }
  else if(a==='manque'){ const k = t.dataset.k; if(S.menu.extra[k]) delete S.menu.extra[k]; else S.menu.extra[k] = true; save(); render(); }
  else if(a==='stp' || a==='stm'){ const o = S.stock[t.dataset.k]; if(!o) return; o.q += (a==='stp'?1:-1)*stepOf(o.u); if(o.q<=0) delete S.stock[t.dataset.k]; save(); render(); }
  else if(a==='ladd'){ S[t.dataset.l].push({name:'', q:1, u:'un', r:'épicerie'}); save(); renderReglages(); }
  else if(a==='ldel'){ arm(t, 'Confirmer', () => { S[t.dataset.l].splice(i,1); save(); renderReglages(); }); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if(t.dataset.ck && cook){ const o = ckRead(), x = o[cook.key] = o[cook.key] || {c:{}}; x.ts = Date.now(); x.c = x.c || {};
    if(t.checked) x.c[t.dataset.ck] = 1; else delete x.c[t.dataset.ck]; ckWrite(o); ckProgress(); return; }
  if(bindDraft(t)) return;
  if(t.classList.contains('ib_u') || t.classList.contains('ib_ray')){ const d = drafts[t.dataset.ib], x = d && d.rows[+t.dataset.j]; if(x){ if(t.classList.contains('ib_u')) x.u = t.value; else x.ray = t.value; } return; }
  if(t.classList.contains('ib_n')){ const d = drafts[t.dataset.ib], x = d && d.rows[+t.dataset.j]; if(x){ x.n = t.value.trim(); const c = catFind(x.n), w = t.closest('.ibw');
      if(c){ x.ray = c.ray; if(!x.q){ x.u = c.u; w.querySelector('.ib_u').value = c.u; } w.querySelector('.ib_rw').innerHTML = ''; } else w.querySelector('.ib_rw').innerHTML = x.n ? rayPick(t.dataset.ib, +t.dataset.j, x) : ''; } return; }
  if(t.id==='an'){ anFill(catFind(t.value), true); return; }
  if(t.dataset.p){ S.p[t.dataset.p] = numIn(t.value); ajuster(); save(); render(); return; }
  if(t.dataset.ps){ S.p[t.dataset.ps] = t.value; save(); render(); return; }
  if(t.dataset.pb){ S.p[t.dataset.pb] = t.checked; save(); render(); return; }
  if(t.dataset.off!==undefined){ const d = +t.dataset.off, o = new Set(S.p.off||[0,6]); if(t.checked) o.add(d); else o.delete(d); S.p.off = [...o]; save(); return; }
  if(t.id==='bk_pick' && t.files && t.files.length){
    const fs = [...t.files], read = f => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result||'')); fr.onerror = () => res(''); fr.readAsText(f); });
    Promise.all(fs.map(read)).then(txts => {
      let best = null; txts.forEach((x, j) => { try{ const o = JSON.parse(x); if(o && o.menu && o.stock){ const ts = +o.maj || 0; if(!best || ts > best.ts) best = {x, ts, n:fs[j].name}; } }catch(e){} });
      const ta = $('#bk_txt'), m = $('#bk_msg');
      if(!best){ if(m) m.textContent = fs.length > 1 ? "Aucun de ces fichiers n'est une copie valide." : "Ce fichier n'est pas une copie valide."; return; }
      if(ta) ta.value = best.x;
      const quand = best.ts ? ` (enregistrée le ${new Date(best.ts).toLocaleString('fr-CA', {day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'})})` : '';
      if(m) m.textContent = (fs.length > 1 ? `${fs.length} fichiers lus. La plus récente : ${best.n}${quand}.` : `Fichier lu${quand}.`) + ' Touche « Restaurer cette copie » pour confirmer.';
    }); return; }
  if(t.dataset.a==='pr_in'){ const v = parseFloat(String(t.value).replace(',','.').replace(/[^0-9.]/g,'')), r = buyList().rows.find(x => x.k===t.dataset.k);
    if(r && v > 0){ S.prices = S.prices||{}; S.prices[r.k] = {pu: v/r.buy, d: isoToday(), s: storeOf(r), sp: !!dealFor(r.name)}; }
    prEdit = ''; save(); render(); return; }
  if(t.dataset.a==='pk_v'){ pick.v = +t.value; return; }
  if(t.dataset.a==='occ_n'){ occ().n = +t.value; save(); render(); return; }
  if(t.dataset.a==='occ_home'){ occ().home = t.checked; save(); render(); return; }
  if(t.dataset.a==='msauce'){ const it = mlist(t.dataset.ml)[+t.dataset.i]; if(it){ if(t.value) it.sc = t.value; else delete it.sc; save(); render(); } return; }
  if(t.dataset.a==='rside'){ setRecSide(t.dataset.r, t.dataset.s, t.value); return; }
  if(t.dataset.a==='mday'){ const L = mlist(t.dataset.ml||'items'), it = L[+t.dataset.i]; if(it){ const nd = t.value, other = L.find(x => x!==it && x.d===nd); if(other){ if(it.d) other.d = it.d; else delete other.d; } if(nd){ it.d = nd; it.dfix = true; } else delete it.d; save(); render(); } return; }
  if(t.id==='paid'){ S.menu.paid = parseFloat(String(t.value).replace(',','.')) || 0; save(); return; }
  if(t.classList.contains('ar_in')){ const b = t.dataset.b, k = t.dataset.k, n = t.dataset.n, u = t.dataset.u, v = String(t.value).trim();
    if(k==='kw' || k==='no' || k==='ray') artSet(b, {n, [k]: v});
    else if(k==='pkq' || k==='pku'){ const box = t.closest('.rbody'), q = parseFloat(String(box.querySelector('[data-k=pkq]').value).replace(',', '.')), pu = box.querySelector('[data-k=pku]').value; artSet(b, {n, pk: q > 0 ? {q: pu==='un' ? Math.round(q) : q, u: pu} : null}); }
    else if(k==='pu'){ const x = parseFloat(v.replace(',', '.').replace(/[^0-9.]/g, '')), key = keyOf(n, u); S.prices = S.prices || {};
      if(x > 0) S.prices[key] = {pu: u==='un' ? x : x/1000, d: isoToday(), s:'', sp:false}; else delete S.prices[key]; }
    openPan.add('art|'+b); save(); render(); return; }
  if(t.dataset.a==='gomode'){ const v = t.value;
    if(v==='+') S.goSome = true;
    else { S.goSome = false; S.skip = v==='*' ? [] : S.stores.filter(s => s!==v);
      if(S.menu.date && !S.menu.achete) S.flash = v==='*' ? "Cette semaine : toutes tes épiceries. La liste et les prix sont à jour; touche « Refaire le menu » pour profiter de tous leurs spéciaux (les plats gardés restent)."
        : `Cette semaine : seulement ${v}. La liste, les prix et les aubaines viennent maintenant de ${v}. Touche « Refaire le menu » pour choisir les plats selon ses spéciaux (les plats gardés restent).`; }
    save(); render(); return; }
  if(t.dataset.go){ const s = t.dataset.go, sk = new Set(S.skip||[]); if(t.checked) sk.delete(s); else sk.add(s); S.skip = [...sk]; save(); render(); return; }
  if(t.dataset.store){ const s = t.dataset.store; S.stores = t.checked ? [...new Set(S.stores.concat(s))] : S.stores.filter(x => x!==s);
    if(t.checked && !STORES.includes(s)){ S.storesx = S.storesx||[]; if(!S.storesx.includes(s)) S.storesx.push(s); } save(); return; }
  if(t.dataset.cp){ S.cp = t.value.trim().toUpperCase(); save(); return; }
  if(t.dataset.rf){ rf[t.dataset.rf] = t.type==='checkbox' ? t.checked : t.value; renderRecettes(); return; }
  if(t.dataset.a==='chk'){
    if(t.checked) S.menu.chk[t.dataset.k]=true; else delete S.menu.chk[t.dataset.k];
    const it = t.closest('.item'); if(it) it.classList.toggle('done', t.checked);
    const rows = buyList().rows, done = rows.filter(r => S.menu.chk[r.k]).length;
    const pt = $('#pg-t'), pb = $('#pg-b'); if(pt) pt.textContent = `${done} sur ${rows.length} dans le panier`; if(pb) pb.style.width = (rows.length?done/rows.length*100:0)+'%';
    const bg = $('#bgl'); const n = rows.length-done; bg.hidden = !n; bg.textContent = n;
    save();
    if(storeMode){ const y = window.scrollY; renderEpicerie(); window.scrollTo(0, y); }
    return;
  }
  if(t.dataset.a==='sidesel'){ const it = mlist(t.dataset.ml||'items')[+t.dataset.i]; if(!it) return; it[t.dataset.s==='f'?'sf':'sv'] = t.value; it.ovr = Object.assign({}, it.ovr, {[t.dataset.s]:false}); it.man = Object.assign({}, it.man, {[t.dataset.s]:1}); save(); render(); return; }
  if(t.dataset.a==='stcat'){ const o = S.stock[t.dataset.k]; if(o){ o.cat = t.value; save(); render(); } return; }
  if(t.dataset.a==='tmsel'){ S.tmx[t.dataset.r] = +t.value; openRec.add(t.dataset.r); save(); render(); return; }
  if(t.dataset.a==='tpsel'){ (S.tpx = S.tpx||{})[t.dataset.r] = +t.value; openRec.add(t.dataset.r); save(); render(); return; }
  if(t.dataset.a==='sideq'){ const it = mlist(t.dataset.ml||'items')[+t.dataset.i]; if(it) it[t.dataset.s==='f'?'fm':'vm'] = parseFloat(t.value); save(); render(); return; }
  if(t.dataset.a==='portions'){ const it = mlist(t.dataset.ml||'items')[+t.dataset.i]; if(it){ if(+t.value) it.pt = +t.value; else delete it.pt; } save(); render(); return; }
  if(t.dataset.a==='stq'){ const o = S.stock[t.dataset.k]; const raw = String(t.value).trim(), v = parseFloat(raw.replace(/\s/g,'').replace(',','.')); if(o){ if(raw!=='' && isNaN(v)){ render(); return; } if(v>0) o.q = v; else delete S.stock[t.dataset.k]; save(); render(); } return; }
  if(t.dataset.l){ const row = S[t.dataset.l][+t.dataset.i]; if(!row) return; const f = t.dataset.f; row[f] = f==='q' ? numIn(t.value) : t.value; save(); return; }
  if(t.id==='d_plan'){ S.dates.plan = t.value; save(); return; }
  if(t.id==='d_shop'){ S.dates.shop = t.value; save(); render(); return; }
  if(t.id==='relay_in'){ S.relay = t.value.trim(); save(); return; }
  if(t.id==='p_cool'){ S.p.cool = +t.value; save(); }
  else if(t.id==='p_var'){ S.p.varMode = t.value; save(); }
  else if(t.id==='p_sou'){ S.p.souper = +t.value; save(); render(); }
  else if(t.id==='p_res'){ S.p.restes = +t.value; save(); render(); }
  else if(t.id==='p_tm'){ S.p.maxTm = +t.value; save(); }
  else if(t.id==='p_lg'){ S.p.nLong = +t.value; save(); }
  else if(t.id==='p_j'){ S.p.jours = +t.value; save(); }
  else if(t.id==='maison'){ S.maison = t.value; save(); }
});
document.addEventListener('toggle', e => { const d = e.target;
  if(d.dataset && d.dataset.pan){ const k = d.dataset.pan, was = openPan.has(k); if(d.open){ openPan.add(k); if(!was && /^art\|/.test(k) && !d.querySelector('.rbody')){ renderArticles(); return; } if(!was && !d.querySelector('.vbox,.rbox') && /^(va|vn|edit)\|/.test(k)) renderRecettes(); } else openPan.delete(k); return; }
  if(d.dataset && d.dataset.rec){ if(d.open){ const lazy = d.dataset.lazy && !openRec.has(d.dataset.rec); openRec.add(d.dataset.rec); if(lazy) renderRecettes(); } else openRec.delete(d.dataset.rec); } }, true);
document.addEventListener('input', e => {
  const t = e.target;
  if(bindDraft(t)) return;
  if(t.classList.contains('ib_q')){ const d = drafts[t.dataset.ib], x = d && d.rows[+t.dataset.j]; if(x) x.q = t.value; return; }
  if(t.classList.contains('ib_n')){ const d = drafts[t.dataset.ib], x = d && d.rows[+t.dataset.j]; if(!x) return; x.n = t.value;
    t.closest('.ibw').querySelector('.sugg').innerHTML = sugBtns(catSearch(t.value), `data-a="ib_pick" data-ib="${esc(t.dataset.ib)}" data-j="${t.dataset.j}"`); return; }
  if(t.id==='oc_q'){ const box = $('#oc_res'); if(box) box.innerHTML = pickSearch(t.value).filter(x => kindOf(x.r)!=='sauce').map(x => { const vs = vars(x.r); return `<div class="item"><span class="t"><b>${esc(x.r.n)}</b><small>${esc([KIND1[kindOf(x.r)], x.v ? 'version '+vname(vs[x.v-1][0]).toLowerCase() : ''].filter(Boolean).join(' · '))}</small></span><button class="btn s" data-a="oc_add" data-r="${esc(x.r.n)}" data-v="${x.v}">Ajouter</button></div>`; }).join(''); return; }
  if(t.classList.contains('ar_sq')){ const b = t.dataset.b; artSq[b] = t.value; const box = document.querySelector(`.ar_sr[data-b="${CSS.escape(b)}"]`); if(box) box.innerHTML = artSearchRows(b, t.value); return; }
  if(['cv_q','cv_u','cv_i'].includes(t.id)){ cv[t.id.slice(3)] = t.value; const o = $('#cv_out'); if(o) o.innerHTML = convOut(); return; }
  if(t.id==='cvp_q' || t.id==='cvp_u'){ cv[t.id==='cvp_q' ? 'pq' : 'pu'] = t.value; const o = $('#cvp_out'); if(o) o.innerHTML = convPrix(); return; }
  if(t.id==='ar_q'){ artF.q = t.value; const pos = t.selectionStart; renderArticles(); const f = $('#ar_q'); if(f){ f.focus(); f.setSelectionRange(pos, pos); } return; }
  if(t.id==='pk_q'){ pick.q = t.value; pick.msg = ''; const box = $('#pk_res'); if(box) box.innerHTML = pickRows(t.value); return; }
  if(t.id==='an'){ const box = $('#an_sugg'); if(box) box.innerHTML = sugBtns(catSearch(t.value, 8), 'data-a="an_pick"'); return; }
});
document.addEventListener('input', e => { if(e.target.id==='rfilt'){ rf.q = e.target.value; const pos = e.target.selectionStart; renderRecettes(); const f = $('#rfilt'); f.focus(); f.setSelectionRange(pos,pos); return; } });
document.addEventListener('input', e => { if(e.target.id==='filt'){ filtre = e.target.value; const pos = e.target.selectionStart; renderMaison(); const f = $('#filt'); f.focus(); f.setSelectionRange(pos,pos); } });


/* ---------- aide ---------- */
function renderAide(){
  const D = (t, body, open) => `<details class="card help" ${open?'open':''}><summary>${t}</summary>${body}</details>`;
  $('#tab-aide').innerHTML = `<button class="btn" id="help_back">← Retour au menu</button>
  <div class="card"><h3>À quoi sert cette application</h3><p>Elle planifie les déjeuners, les dîners, les soupers, les entrées, les soupes et les desserts de la semaine, tient compte des spéciaux de tes épiceries et de ce qu'il y a déjà à la maison, et produit <b>une seule liste d'épicerie complète</b>. Tes données restent sur ton téléphone.</p></div>`
  + D("1. Installer l'application sur l'iPhone", `<ol><li>Ouvre l'adresse de l'application dans <b>Safari</b> (pas dans Messenger ni une autre application).</li>
    <li>Touche <b>Partager</b> (le carré avec une flèche vers le haut), fais défiler la liste d'actions jusqu'à <b>Sur l'écran d'accueil</b>, puis touche <b>Ajouter</b>.</li>
    <li>Ouvre toujours l'application par <b>son icône</b>.</li></ol>
    <div class="warn"><b>Installe avant d'entrer quoi que ce soit.</b> Safari et l'icône de l'écran d'accueil ne partagent pas leurs données.</div>
    <div class="tip">Chaque personne installe l'application sur son téléphone. Les données ne sont pas partagées entre téléphones (voir la section 11).</div>`, true)
  + D('2. Première configuration', `<p>Au premier lancement, la carte <b>Bienvenue</b> du Menu te demande :</p>
    <ul><li><b>Ton code postal</b> : il sert à trouver les circulaires de ta région.</li>
    <li><b>Tes épiceries</b> : seules leurs circulaires sont lues pour les spéciaux. Elles sont classées par genre (supermarchés, escompte, grandes surfaces comme Walmart et Costco, santé et vrac, pharmacies). Le bouton <b>Trouver les épiceries de mon code postal</b> montre celles qui ont une circulaire près de chez toi, y compris les marchés de ta région. Une épicerie manque ? Écris son nom sous « Une épicerie manque ? ».</li>
    <li><b>Combien de soupers, d'entrées et de desserts</b> par semaine.</li>
    <li><b>Les portions</b> : au souper, et en restes pour le dîner du lendemain. Chaque souper est calculé pour la somme des deux.</li>
    <li>Si tu veux, une <b>liste de départ</b> pour les déjeuners, lunchs, collations et boissons. Sinon, l'application reste vide et tu ajoutes tes articles dans Réglages.</li></ul>
    <p>Tout se change ensuite dans <b>Réglages</b>.</p>`)
  + D('3. Faire le menu de la semaine', `<ol>
    <li>Règle les dates : <b>Je planifie le</b> et <b>J'achète le</b>. Les spéciaux retenus sont ceux valides le jour de l'épicerie.</li>
    <li>Tu ne vas qu'à une de tes épiceries cette semaine, ou tu commandes en ligne ? Sur la carte de la semaine, choisis <b>Cette semaine, je fais l'épicerie : Seulement chez Maxi</b> (par exemple). Le menu suit les spéciaux de Maxi, et la liste, les prix, « Moins cher ailleurs » et les aubaines ne parlent que de Maxi. Une petite note dit seulement combien tu sauverais ailleurs, sans rien changer. « Dans quelques-unes… » permet d'en cocher plusieurs. La liste complète de tes épiceries se change dans Réglages.</li>
    <li>Une envie précise ? <b>Ajouter un plat de mon choix</b> (Menu) : cherche un plat, une version ou un ingrédient (burger Nashville, saumon, potage), puis choisis le jour. Le plat reste au menu quand tu le refais. Tu peux le faire avant de créer le menu : l'application complète le reste. Dans Recettes, le bouton <b>Ajouter au menu de la semaine</b> fait la même chose.</li>
    <li><b>Reporter un souper</b> : resto ou changement de plan ? Ouvre le plat, touche <b>Reporter</b> : « À demain » fait glisser les soupers suivants d'un jour jusqu'au prochain soir libre; « À la semaine prochaine » le met de côté, il sera déjà au menu de la semaine suivante et ses ingrédients restent dans Maison. La carte Aujourd'hui a aussi « On mange au resto : reporter à demain ».</li>
    <li><b>Portions</b> : ouvre un plat et choisis le nombre de portions (2 pour un souper à deux, 12 quand on reçoit). La liste d'épicerie s'ajuste.</li>
    <li><b>Je reçois ou repas à deux</b> (Menu) : choisis des plats et le nombre de personnes. L'application fait une liste d'épicerie juste pour ce repas, que tu peux copier pour une course de dernière minute, ou mettre au menu un soir de la semaine.</li>
    <li>Touche <b>Chercher les spéciaux</b>, puis <b>Créer le menu</b>. Les plats sont choisis selon les spéciaux, ce qui est déjà à la maison, tes favoris et le temps de préparation, sans répéter les plats récents ni ceux mis de côté.</li>
    <li>En haut du Menu, les menus <b>Déjeuners</b>, <b>Dîners</b>, <b>Soupers</b>, <b>Entrées</b>, <b>Soupes</b> et <b>Desserts</b> changent le nombre de plats : le menu s'ajuste aussitôt.</li>
    <li>Sur chaque souper, ouvre <b>Accompagnements</b> pour choisir le féculent et le légume ou salade, leur quantité (Aucun, Moins, Normal, Plus, Double) et les portions du repas.</li>
    <li>Les pastilles <b>Normale, Épicée…</b> changent la version. Le détail de la version (ingrédients ajoutés ou retirés, préparation) s'affiche dessous.</li>
    <li><b>Garder</b> verrouille un plat, <b>Autre plat</b> le remplace. Le bouton <b>Plus</b> contient <b>Copier la recette</b>, <b>Je n'aime pas</b> (le plat est mis de côté pour de bon et remplacé) et <b>Retirer du menu</b>. Dans « Recette et ingrédients », « retirer » enlève un ingrédient de la liste.</li>
    <li>Les étiquettes jaunes montrent les spéciaux trouvés dans tes circulaires : produit, prix et magasin.</li>
    <li>Chaque souper a un <b>jour</b> (en haut de sa carte). Touche-le pour déplacer le plat; l'autre plat prévu ce jour-là prend sa place.</li></ol>`)
  + D("4. Les jours de la semaine et la carte Aujourd'hui", `<ul><li>Dans Réglages, coche tes <b>jours de congé</b>. Les soupers plus longs y sont placés; les jours de travail reçoivent les plats rapides (<b>Temps max. en semaine</b>, 35 min par défaut).</li>
    <li>Les plats « à la mijoteuse » se préparent le matin en 15 minutes : ils vont bien un jour de travail.</li>
    <li>La carte <b>Aujourd'hui</b>, en haut du Menu, montre le déjeuner, le dîner et le souper du jour, celui de demain, avec les rappels : sortir la viande du congélateur la veille, partir la mijoteuse le matin, garder des restes.</li>
    <li><b>Cuisiner</b> ouvre la recette en grand : ingrédients pour tes portions (avec la sauce et les accompagnements) et étapes à cocher. L'écran reste allumé. Sur chaque plat du menu, <b>Recette</b> ouvre la même vue pour y jeter un coup d'œil pendant la planification.</li></ul>`)
  + D('5. Déjeuners, dîners et restes', `<ul><li><b>Déjeuners</b> : ils ont leur section dans Recettes (crêpes, galettes de sarrasin, pain doré, déjeuner de cabane, gruau de nuit…). Les plus longs vont aux jours de congé. Les céréales, rôties et cafés de tous les jours restent dans la liste « Déjeuners, lunchs » de Réglages.</li>
    <li><b>Dîners</b> : chaque souper est cuisiné avec des portions de plus (Réglages, « Portions de restes »). Le midi suivant, le dîner, ce sont ces restes : rien à acheter. Les jours sans restes, l'application choisit une recette de la banque des soupers, différente de celles de la semaine, pour les portions d'un dîner.</li>
    <li>Sur un jour de restes, <b>Préparer un dîner à la place</b> ajoute une recette. Sur un dîner cuisiné, <b>Manger plutôt les restes de…</b> fait l'inverse, et <b>Pas de dîner ce jour-là</b> (sous Plus) le retire.</li>
    <li><b>Ajouter un plat de mon choix</b> : pour une recette de souper, choisis <b>Au souper</b> ou <b>Au dîner</b>, puis le jour.</li>
    <li>La carte <b>Aujourd'hui</b> rappelle de garder les restes du souper pour le dîner du lendemain.</li><li>Quand une grosse pièce est au menu (épaule de jambon, poulet entier, rôti de porc…), un deuxième plat qui utilise ses restes est ajouté plus tard dans la semaine : sandwichs au jambon haché, croque-monsieur, pâtes au jambon, pâté au poulet…</li>
    <li>La carte de la grosse pièce indique <b>Restes prévus pour</b> : la quantité achetée est augmentée en conséquence. Celle du deuxième plat indique <b>Avec les restes de</b> : cet ingrédient n'est pas racheté.</li>
    <li>Le deuxième plat est toujours placé après le premier. Pour ne plus jumeler les plats, décoche l'option dans Réglages, carte « Organisation de la semaine ».</li></ul>`)
  + D('6. Plats préparés, collations, entrées et desserts', `<ul><li>Les <b>entrées</b> et les <b>desserts</b> choisis en haut du Menu ont leur section sous les soupers, et leurs ingrédients sont dans la liste d'épicerie.</li>
    <li>La carte <b>Collations en spécial</b> (Menu) propose des fruits, yogourts, fromages, craquelins, barres et autres collations annoncés dans tes circulaires. « Ajouter » en met un paquet dans la liste pour cette semaine seulement. Pour ne plus la voir : Réglages, carte « Mes collations ».</li>
    <li>Les <b>plats préparés</b> (pizza, lasagne ou pâté surgelés, poulet rôti ou sushis du comptoir…) portent l'étiquette <b>Prêt à servir</b>, et <b>En spécial</b> quand une de tes circulaires les annonce.</li>
    <li>Dans Réglages, choisis : les mettre au menu quand ils sont en spécial (1 par semaine au plus), seulement les suggérer (carte « Plats préparés en spécial » du Menu), les traiter comme les autres plats, ou jamais.</li></ul>`)
  + D('7. Après le repas : on a aimé ou pas', `<p>Le jour même ou après, touche <b>On a aimé</b> ou <b>Pas aimé</b> sur la carte du souper. Un plat aimé revient plus souvent; un plat peu aimé revient moins souvent, et après deux « Pas aimé » il n'est plus proposé automatiquement (tu peux toujours l'ajouter toi-même). Pour l'écarter pour de bon, utilise <b>Je n'aime pas</b>.</p>`)
  + D("8. L'inventaire : ce qu'il y a à la maison", `<ul><li>L'onglet <b>Maison</b> garde ce que tu as. Tout ce qui s'y trouve est déduit de la liste et favorise les plats qui l'utilisent.</li>
    <li><b>Ajouter un article</b> : tape quelques lettres (« fromage », « poulet ») et touche l'aliment proposé. L'unité, le rayon et la catégorie se remplissent tout seuls; il reste à vérifier la quantité. Tu peux aussi <b>choisir par rayon</b>.</li>
    <li>Un aliment que l'application ne connaît pas est accepté : vérifie alors son rayon et sa catégorie. « Féculent » ou « Légume ou salade » en fait un accompagnement possible (un sac de rouleaux de printemps, par exemple).</li>
    <li>Une quantité très petite en grammes (3 g, par exemple) demande une confirmation : c'était peut-être 3 kg ou 3 paquets.</li>
    <li>Tape une quantité exacte ou utilise − et +. À 0, l'article disparaît. « À utiliser cette semaine » (Menu) propose d'utiliser ce qui dort à la maison.</li></ul>`)
  + D("9. Faire l'épicerie une seule fois", `<ol><li>L'onglet <b>Épicerie</b> classe tout <b>par rayon</b> ou <b>par magasin</b>. Par magasin, chaque article va à l'épicerie où il est le moins cher en spécial; le reste va à ton épicerie principale (Réglages).</li>
    <li><b>Mode magasin</b> : gros texte, écran qui reste allumé quand le téléphone le permet, et les articles cochés descendent dans « Dans le panier ». Touche <b>Quitter</b> pour revenir.</li>
    <li>« Vérifier avant de partir » rappelle les articles toujours à la maison : touche <b>Il manque</b> au besoin.</li>
    <li>Avec un <b>budget</b> (Réglages), l'onglet montre ton budget et le coût estimé des articles en spécial. Au retour, inscris le <b>total payé</b> à la caisse : la moyenne payée s'affiche dans Réglages, carte Historique.</li>
    <li><b>Prix et budget</b> : chaque article montre un prix. « ≈ » veut dire un prix habituel estimé (moyennes du Québec de Statistique Canada quand elles existent). Un spécial donne le prix de la circulaire; quand la circulaire indique le rabais en %, l'application en déduit le prix régulier. Touche un prix pour noter ce que tu as payé : l'application le retient pour les semaines suivantes. Le total estimé se compare à ton budget.</li>
    <li><b>Moins cher ailleurs</b> : l'application lit les circulaires de toutes tes épiceries, même celles décochées pour la semaine. Si un article est nettement moins cher ailleurs, c'est écrit sous l'article, et une carte résume l'économie possible par épicerie.</li>
    <li><b>Vraies aubaines</b> : un rabais d'au moins 35 % sur un produit qui se garde (viande et poisson à congeler, surgelés, garde-manger, beurre, fromage) apparaît dans « Vraies aubaines : fais des réserves », avec un conseil de conservation et « En ajouter ».</li>
    <li>Coche les articles dans le panier, puis touche <b>Épicerie terminée</b> au retour : ils entrent dans Maison.</li></ol>`)
  + D('10. Terminer la semaine', `<p><b>Terminer la semaine</b> (Menu) retire de Maison ce qui a été utilisé, garde les restes et range les plats dans l'historique. Exemple : 12 oeufs achetés, 8 utilisés, il en reste 4 pour la semaine suivante.</p>`)
  + D('11. Copier, envoyer et importer', `<ul><li>Rien n'est partagé automatiquement. La carte <b>Copier pour envoyer</b> copie la liste d'épicerie, le menu de la semaine ou le menu détaillé. Colle le texte dans un message ou dans Notes.</li>
    <li>Chaque recette a son bouton <b>Copier cette recette</b>. Le message se termine par un code qui contient toute la recette, versions comprises.</li>
    <li>Pour la recevoir sur un autre téléphone : onglet Recettes, <b>Importer une recette copiée</b>, colle le message, touche <b>Importer</b>. Plusieurs recettes peuvent être collées d'un coup.</li>
    <li><b>Recette d'un site Internet</b> (Ricardo, 5-15, Pratico-pratiques…) : dans Safari, sélectionne le titre, les ingrédients et la préparation, touche Copier, puis colle dans « Importer une recette copiée ». L'application comprend les mesures (c. à soupe, tasse, lb, boîte de 796 ml), les fractions et les mots de préparation (haché, en dés, au goût), relie chaque ingrédient à un aliment connu et ajuste la recette à 6 portions. Le formulaire « Nouvelle recette » se remplit : vérifie, puis enregistre. Astuce : le bouton Partager → Copier ne copie que le lien; la version « Imprimer » du site rend la sélection plus facile.</li></ul>`)
  + D('12. La banque de recettes', `<ul><li>L'onglet <b>Recettes</b> regroupe les plats par <b>protéine</b>, par <b>style</b> ou par <b>genre</b> (soupers, entrées, desserts). Les filtres combinent recherche, genre, protéine, style, « 30 min ou moins » et favoris.</li>
    <li><b>Je n'aime pas</b> met une recette de côté : elle n'est plus jamais proposée. Coche « Mis de côté » pour les revoir et <b>Remettre dans la banque</b>.</li>
    <li><b>Accompagnements</b> : chaque souper montre son féculent et son légume. « Varié » laisse l'application choisir chaque semaine parmi ceux qui vont avec le plat; choisis-en un pour l'avoir à tout coup, ou « Aucun ». La section <b>Accompagnements</b> (en bas de l'onglet, ou Genre : Accompagnements) montre tous les féculents et légumes avec leurs ingrédients; « Ne plus le proposer » le retire des choix automatiques.</li>
    <li><b>Soupes et potages</b> : un genre à part, pour les lunchs ou en entrée. Choisis combien en faire par semaine sur la carte de la semaine ou dans Réglages.</li>
    <li><b>Sauces</b> : des compléments, pas des repas. Ouvre un souper du menu et choisis une « Sauce en complément » (sauce au poivre avec un steak, par exemple), ou touche <b>Ajouter à un plat du menu</b> dans la recette de la sauce. Ses ingrédients vont dans la liste d'épicerie.</li>
    <li><b>Nouvelle recette</b>, <b>Modifier la recette</b> et les versions utilisent le même formulaire guidé : pour chaque ingrédient, tape quelques lettres, touche l'aliment proposé, puis indique la quantité et l'unité dans les menus. Le rayon se remplit tout seul; pour un aliment nouveau, l'application demande dans quel rayon il se trouve.</li>
    <li><b>Ajouter une version</b> ou <b>Modifier cette version</b> : coche les ingrédients à retirer, ajoute ceux qui changent, choisis l'accompagnement et écris la préparation propre à cette version. « Retirer cette version » la cache, « Rétablir les variantes d'origine » annule tes changements.</li>
    <li>Ce que tu tapes dans un formulaire reste là même si tu changes d'onglet. Un message sous le formulaire indique ce qui manque (un nom, une quantité…).</li>
    <li>Les soupers sont écrits pour 6 portions et ajustés à tes portions; les entrées et desserts donnent environ 6 à 8 portions.</li></ul>`)
  + D('13. Si la recherche des spéciaux ne fonctionne pas', `<ul><li>Vérifie tes épiceries et ton code postal dans Réglages.</li>
    <li>Si le navigateur bloque la requête, copie le texte d'une circulaire (<a href="https://flipp.com/fr-ca" target="_blank" rel="noopener">Flipp</a>) et colle-le dans « Si la recherche ne fonctionne pas ».</li>
    <li>Sans spéciaux, tout fonctionne : le menu est simplement choisi sans les rabais.</li></ul>`)
  + D('14. Sauvegarder', `<ul><li>Les données sont enregistrées sur ce téléphone à chaque action. <b>Une mise à jour de l'application ne les touche pas</b> : elle remplace seulement le code, et chaque nouvelle version lit les données de l'ancienne.</li>
    <li>Par sécurité, l'application garde une <b>copie automatique</b> avant chaque mise à jour et une fois par jour (les 5 dernières, dans Réglages → Sauvegarde). Si une version n'arrive pas à lire tes données, elle les met de côté au lieu de les effacer.</li>
    <li>Ce qui peut effacer les données : supprimer l'icône de l'écran d'accueil, effacer les données des sites dans les réglages de l'iPhone, ou ouvrir l'application à une autre adresse. Garde la même adresse et ne supprime pas l'icône.</li>
    <li>Pour être protégé même dans ces cas : Réglages → <b>Enregistrer une copie dans Fichiers</b>, puis « Enregistrer dans Fichiers ». Fais-le après avoir rempli ton garde-manger, puis une fois par mois. Pour revenir en arrière : « Restaurer une copie » et choisis le fichier.</li></ul>`)
  + D("15. Articles : corriger un spécial, convertir une mesure", `<ul><li>L'onglet <b>Articles</b> montre le spécial associé à chaque article de ta liste (« Ma liste »), de tous les articles connus (« Tous ») ou de ceux que tu as modifiés.</li>
    <li>Un spécial n'est pas le bon ? Touche « Pas le bon ? » sous l'étiquette jaune dans la liste, ou ouvre l'article. Choisis un autre spécial, « Aucun spécial cette semaine », ou cherche le bon dans les circulaires : « Cette semaine » l'associe jusqu'à la fin de la semaine, « Toujours » retient ce produit pour les prochaines semaines.</li>
    <li>Tu peux aussi changer les <b>mots recherchés</b> (une virgule sépare deux façons de le nommer), ajouter des <b>mots à exclure</b> (pané, assaisonné…), choisir le <b>rayon</b>, le <b>format du paquet</b> et le <b>prix habituel</b>.</li>
    <li>À chaque recherche des spéciaux, le prix trouvé est noté. Quand un article n'est pas en spécial, la liste dit à quel prix il l'est souvent.</li>
    <li>Le <b>convertisseur</b> passe des g aux lb, des ml aux tasses et cuillères (avec la densité de la farine, du sucre, du beurre…), et des prix à la livre aux prix au kilo.</li></ul>`)
  + D('16. Questions fréquentes', `<p><b>Le menu ne change pas quand je le refais.</b> Les plats « Gardé » restent; une fois l'épicerie terminée, le menu est verrouillé jusqu'à « Terminer la semaine ».</p>
    <p><b>Un article est en double.</b> Deux recettes le nomment différemment; additionne-les en magasin.</p>
    <p><b>Les quantités ne conviennent pas.</b> Ajuste les portions (Réglages ou repas par repas), les quantités d'accompagnements, ou modifie la recette. Les quantités des recettes sont des estimations : corrige celles qui ne conviennent pas à ta famille.</p>
    <p><b>Un spécial ne correspond pas à l'article</b> (ex. des oeufs Kinder pour des oeufs). Onglet Articles → l'article → « Pas ce produit » : il ne sera plus jamais associé. Les friandises, plats préparés et produits « à la » ou « aux » (nouilles aux oeufs, poulet au beurre) sont déjà écartés automatiquement.</p>
    <p><b>Tout recommencer.</b> Réglages → « Tout remettre à zéro ».</p>`);
}


/* ---------- démarrage ---------- */
/* un brouillon de recette réellement commencé (pas seulement un formulaire vide ouvert) */
const draftsDirty = () => { try{ return Object.values(drafts).some(d => d && ((typeof d.n==='string' && d.n.trim()) || (typeof d.s==='string' && d.s.trim()) || (Array.isArray(d.rows) && d.rows.some(r => r && typeof r.n==='string' && r.n.trim())))); }catch(e){ return false; } };
const missingFiles = () => [typeof RECIPES==='undefined' && 'recettes.js', typeof BAREME==='undefined' && 'prix-maxi.js'].filter(Boolean);
(function init(){
  try{ if('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', {updateViaCache: 'none'}).then(reg => { document.addEventListener('visibilitychange', () => { if(document.visibilityState==='visible') reg.update().catch(()=>{}); }); }).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if(draftsDirty()){ setSync('Nouvelle version prête : elle s\'appliquera à la prochaine ouverture.'); return; } if(had && !sessionStorage.getItem('maj_rechargee')){ try{ sessionStorage.setItem('maj_rechargee', '1'); }catch(e){} location.reload(); } });
  } }catch(e){}
  loadLocal();
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{}); }catch(e){}
  try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); }catch(e){}
  try{ render(); }
  catch(err){
    /* un fichier de l'application n'a pas été chargé (connexion) : ce ne sont pas les données, on ne touche à rien */
    if(missingFiles().length){ setSync("Un fichier de l'application n'a pas pu être chargé (" + missingFiles().join(', ') + "). Vérifie la connexion et recharge la page. Tes données sont intactes."); return; }
    /* données qui empêchent l'affichage : on les met de côté et on n'enregistre plus rien par-dessus */
    try{ const j = localStorage.getItem(KEY); if(j && !localStorage.getItem(RESCUE)) localStorage.setItem(RESCUE, j); }catch(_){}
    loadFailed = true; rescued = false; S = DEFAULT(); S.appv = APPV;
    S.flash = "Tes données ont causé une erreur d'affichage. Elles sont gardées telles quelles, rien n'est effacé ni remplacé : Réglages → Sauvegarde → « Essayer de les restaurer », ou « Tout remettre à zéro » pour repartir.";
    try{ render(); }catch(_){}
  }
  setSync(loadFailed ? 'Mode secours : tes données sont gardées de côté' : 'Enregistré sur cet appareil');
  /* dernière protection : une erreur imprévue s'affiche au lieu de bloquer l'application en silence */
  window.addEventListener('error', e => { setSync('Petit problème : ' + (e.message || 'erreur') + '. Tes données sont intactes.'); });
  window.addEventListener('unhandledrejection', e => { setSync('Petit problème : ' + ((e.reason && e.reason.message) || 'erreur') + '. Tes données sont intactes.'); });
})();
