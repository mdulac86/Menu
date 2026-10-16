/* Menu de la semaine — Liste d'épicerie, prix, barème et association des spéciaux.
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
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
/* date d'épicerie (ramassage) : choisie à la main, sinon celle du menu en cours, sinon le prochain jour de ramassage du profil */
const shopISO = () => S.dates.shop || (S.menu && S.menu.date && S.menu.shop) || (isObj(S.profil) ? nextPickup() : isoToday());
/* premier jour du menu : fixé à sa création (les jours ne glissent pas), sinon le premier jour de cuisine après le ramassage */
const weekStart = () => (S.menu && S.menu.date && S.menu.start) || startFrom(shopISO());
const fmtDate = iso => { try{ return new Date(iso+'T12:00:00').toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ return iso; } };
const nice = t => { t = String(t).trim(); return t.charAt(0).toUpperCase()+t.slice(1).toLowerCase(); };
const cap = t => { t = String(t); return t.charAt(0).toUpperCase()+t.slice(1); };
/* Épiceries de la semaine : les favorites (Profil) moins celles décochées sur la carte de la semaine. */
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
const PRIX_MAJ_TXT = () => { try{ return 'mis à jour le ' + new Date(prixDate()+'T12:00:00').toLocaleDateString('fr-CA', {day:'numeric', month:'long', year:'numeric'}); }catch(e){ return PRIX_MAJ; } };
const prixVieux = () => { try{ return gapDays(prixDate(), isoToday()) > 120; }catch(e){ return false; } };
/* rappel mensuel de mise à jour des prix (désactivable, « dans une semaine » possible) */
const prixRappel = () => { try{ const p = pmaj(); return S.setup && !peFrais() && p.rappel !== false && gapDays(prixDate(), isoToday()) >= 30 && !(p.snooze && p.snooze > isoToday()); }catch(e){ return false; } };
const _BMC = new Map();
function baremeRaw(name){
  const n = norm(name); if(_BMC.has(n)) return _BMC.get(n);
  const b = BAREME.find(x => x[0].test(n)) || null; _BMC.set(n, b); return b;
}
/* Mise à jour des prix : un prix inscrit (S.bx, par entrée du barème) remplace celui du fichier;
   les autres prix suivent l'ajustement global en % (S.pmaj.pct), pour suivre l'inflation. */
const pmaj = () => (S.pmaj = isObj(S.pmaj) ? S.pmaj : {});
const pctF = () => 1 + (Math.max(-50, Math.min(100, +pmaj().pct || 0)) / 100);
const bxKey = b => b[0].source;
function baremeOf(name){ const b = baremeRaw(name); return b ? mergeBx(b) : null; }
function mergeBx(b){
  const o = b[1], ov = (S.bx || {})[bxKey(b)] || {}, k = pctF();
  const m = Object.assign({}, o);
  if(o.f) m.f = o.f.map(([s, p], i) => [s, ov.f && ov.f[i] > 0 ? ov.f[i] : Math.round(p * k * 100) / 100]);
  if(o.kg) m.kg = ov.kg > 0 ? ov.kg : Math.round(o.kg * k * 100) / 100;
  return [b[0], m];
}
/* date de la dernière mise à jour des prix : celle du fichier ou celle faite dans l'application */
const prixDate = () => { const d = pmaj().d || ''; return d > PRIX_MAJ ? d : PRIX_MAJ; };
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
  if(hit && hit[1][b] !== undefined) return hit[1][b]/f * pctF();
  const d = PRIX_DEF[ray] || PRIX_DEF['épicerie'];
  return (d[b] !== undefined ? d[b] : (d.un || 4))/f * pctF();
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
/* coût d'une ligne à l'épicerie où elle va (voir epiceries.js : tes prix, le relevé, l'estimation, les spéciaux) */
function rowEco(r){
  if(_ECO.has(r.k)) return _ECO.get(r.k);
  const s = storeOf(r), c = costAt(r, s);
  /* rabais annoncé par la circulaire : le prix régulier qu'elle indique, s'il est plus haut */
  const reg = c.deal && c.deal.d > 0 && c.deal.d < 95 ? Math.max(c.reg, c.cost/(1 - c.deal.d/100)) : c.reg;
  const o = {cost:c.cost, reg, save:Math.max(0, reg - c.cost), mine: c.src==='mine', deal:c.deal, rsp:c.rsp, src:c.src, store:s};
  _ECO.set(r.k, o); return o;
}
function listTotals(rows){ let cost = 0, save = 0; rows.forEach(r => { const e = rowEco(r); cost += e.cost; save += e.save; }); return {cost: cost * calF(), save, raw: cost}; }
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
/* nettement moins cher dans une autre de tes épiceries ? (seulement d'après un vrai prix : spécial, relevé ou ton prix) */
function cheaper(r){
  if(_CMP.has(r.k)) return _CMP.get(r.k);
  let out = null;
  const A = storeOf(r), cA = costAt(r, A); let best = null;
  S.stores.filter(s => s !== A).forEach(s => { const c = costAt(r, s); if(c.src === 'est' && !c.deal && !c.rsp) return; if(!best || c.cost < best.c.cost) best = {s, c}; });
  if(best && best.c.cost < cA.cost*0.9 && cA.cost - best.c.cost >= 0.5) out = {store:best.s, cost:best.c.cost, costA:cA.cost, A, aDeal: !!(cA.deal || cA.rsp), save: cA.cost - best.c.cost, sp: !!(best.c.deal || best.c.rsp)};
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
