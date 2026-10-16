/* Menu de la semaine — Prix par épicerie et comparateur « Où faire l'épicerie cette semaine ».
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html.

   Le prix d'un article dans une épicerie vient, dans l'ordre :
   1. du prix que tu as payé ou inscrit chez elle (S.prices, avec le magasin) ;
   2. du relevé du robot (prix-epiceries.json : Maxi et IGA, chaque semaine) ;
   3. d'une estimation : le prix de référence Maxi × l'écart de cette épicerie (calculé sur le relevé, sinon une valeur de départ).
   Un spécial (circulaire Flipp ou promotion du relevé) valide le jour de l'épicerie le remplace s'il coûte moins. */
const PE_KEY = PFX + 'pe', PE_URL = 'prix-epiceries.json';
let PE = null, _PEX = null, _CAT_S = new Map(), _DCA = new Map(), _CMPR = null, _SPA = null;
/* chaînes relevées par le robot */
const CHAINES = {Maxi:'maxi', IGA:'iga'};
/* écart de départ avec Maxi, quand le relevé ne permet pas de le calculer (prix réguliers moyens) */
const ECART0 = {Maxi:1, 'Super C':1.01, Walmart:1.0, 'Tigre Géant':1.03, Costco:0.92, IGA:1.12, Metro:1.13, Provigo:1.1, 'Inter-Marché':1.1, 'Marché Ami':1.1, 'Marché Richelieu':1.12, 'Marchés Tradition':1.12, Bonichoix:1.14, Axep:1.14, Mayrand:0.97};
function peReset(){ _PEX = null; _CAT_S = new Map(); _DCA = new Map(); _CMPR = null; _SPA = null; }
function peLoad(){ try{ const o = JSON.parse(localStorage.getItem(PE_KEY) || 'null'); if(peOk(o)) PE = o; }catch(e){} }
const peOk = o => !!o && o.v === 1 && isObj(o.p) && Array.isArray(o.magasins);
/* va chercher le dernier relevé (une fois par jour, ou sur demande) */
let peBusy = false;
async function peFetch(force){
  if(peBusy || (!force && PE && (S.pe||{}).f === isoToday())) return false;
  peBusy = true;
  try{
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = ctl ? setTimeout(() => ctl.abort(), 10000) : 0;
    const r = await fetch(PE_URL, {cache:'no-store', signal: ctl ? ctl.signal : undefined}); clearTimeout(tm);
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const o = await r.json(); if(!peOk(o)) throw new Error('relevé illisible');
    PE = o; try{ localStorage.setItem(PE_KEY, JSON.stringify(o)); }catch(e){}
    S.pe = Object.assign({}, S.pe, {f: isoToday()}); peSel(); resetCaches(); return true;
  } finally { peBusy = false; }
}
/* magasin choisi pour chaque chaîne (le premier du relevé par défaut) */
function peSel(){
  if(!isObj(S.pe)) S.pe = {};
  if(PE) Object.values(CHAINES).forEach(ch => { const L = PE.magasins.filter(m => m.ch === ch); if(L.length && !L.some(m => m.id === S.pe[ch])) S.pe[ch] = L[0].id; });
  return S.pe;
}
const peMag = store => { const ch = CHAINES[store]; if(!ch || !PE) return null; const id = peSel()[ch]; return PE.magasins.find(m => m.ch === ch && m.id === id) || null; };
const peData = store => { const m = peMag(store); return m ? PE.p[m.ch + ':' + m.id] || null : null; };
/* date du relevé le plus récent (AAAA-MM-JJ), '' sans relevé */
const peDate = () => PE ? PE.magasins.map(m => m.d || '').sort().pop() || '' : '';
const peFrais = () => { const d = peDate(); return !!d && gapDays(d, isoToday()) <= 30; };

/* ---------- coût d'une ligne avec un barème donné (formats ou prix au kilo) ---------- */
function costWith(r, o){
  const n = norm(r.name), q = r.def > 0 ? r.def : r.buy;
  if(o.kg){ const g = r.u==='g' ? q : r.u==='un' ? q * (gpuOf(n) || o.gpu || 0) : 0; return g ? g/1000*o.kg : null; }
  if(!o.f || !o.f.length) return null;
  if(r.u===o.u) return bestFormats(q, o.f).cost;
  if(r.u==='un' && o.u==='g' && gpuOf(n)) return bestFormats(q*gpuOf(n), o.f).cost;
  if(r.u==='un') return q * o.f[0][1];
  return null;
}
/* prix de référence (Maxi) sans tes prix : barème ou estimation */
function estBase(r){
  if(r.plan) return r.plan.cost; const bc = baremeCost(r); if(bc != null) return bc;
  let q = r.buy; const n = norm(r.name), A = art(r.name);
  if(r.u==='un' && !PKG_RE.test(n)){ const d = A.pk && A.pk.u==='un' && A.pk.q > 0 ? [0, A.pk.q] : PACK_UN.find(([re]) => re.test(n)); if(d) q = Math.max(1, Math.ceil(r.buy/d[1] - 0.05)) * d[1]; }
  return prixBase(r.name, r.u, r.rayon) * q;
}
/* prix unitaire régulier d'une entrée du relevé (par g, ml, unité ou kg) */
const peUnit = e => !e ? null : e.kg ? e.kg[0] : (() => { const L = e.f.filter(x => x[1] != null).map(x => x[1]/x[0]); return L.length ? Math.min(...L) : null; })();
/* une promotion du relevé est-elle valide le jour de l'épicerie ? */
function peValide(c, deb, fin){
  if(!(c > 0)) return false; const d = shopISO();
  if(deb && deb > d) return false;
  return fin ? fin >= d : !!deb && addDays(deb, 6) >= d;
}
/* le relevé pour une ligne dans une épicerie : {reg, cur, sp, nom, fin} ou null */
function peLine(r, store){
  const D = peData(store); if(!D) return null;
  const b = baremeRaw(r.name); if(!b) return null;
  const e = D[bxKey(b)]; if(!e) return null;
  /* garde-fou : un prix très loin de la référence Maxi est probablement un autre produit */
  const ref = (() => { const M = peData('Maxi'), m = M && M[bxKey(b)]; const u = peUnit(m); if(u) return u; const o = b[1]; return o.kg || Math.min(...o.f.map(x => x[1]/x[0])); })();
  const u = peUnit(e); if(u != null && ref && (u > ref*2.2 || u < ref*0.4)) return null;
  const o = b[1];
  if(e.kg){ const [reg, c, deb, fin, nom] = e.kg, sp = peValide(c, deb, fin);
    const R = reg != null ? costWith(r, {kg:reg, gpu:o.gpu}) : null, C = sp ? costWith(r, {kg:c, gpu:o.gpu}) : R;
    return R == null && C == null ? null : {reg:R, cur:C == null ? R : C, sp: sp && C != null && (R == null || C < R - 0.01), nom, fin}; }
  const FR = e.f.filter(x => x[1] != null).map(x => [x[0], x[1]]);
  const FC = e.f.map(x => [x[0], peValide(x[2], x[3], x[4]) ? x[2] : x[1]]).filter(x => x[1] != null);
  const R = FR.length ? costWith(r, {u:o.u, f:FR, gpu:o.gpu}) : null, C = FC.length ? costWith(r, {u:o.u, f:FC, gpu:o.gpu}) : R;
  if(R == null && C == null) return null;
  const spx = e.f.find(x => peValide(x[2], x[3], x[4]));
  return {reg:R, cur:C == null ? R : C, sp: !!spx && C != null && (R == null || C < R - 0.01), nom: (spx || e.f[0])[5], fin: spx ? spx[4] : ''};
}
/* écart de prix d'une épicerie avec Maxi : médiane sur les articles relevés aux deux endroits */
function ecart(store){
  if(store === 'Maxi' || !S.stores.includes(store)) return 1;
  if(!_PEX) _PEX = {};
  if(_PEX[store] != null) return _PEX[store];
  let v = ECART0[store] || 1.08;
  const D = peData(store), M = peData('Maxi');
  if(D && M){ const R = Object.keys(D).map(k => { const a = peUnit(D[k]), b = peUnit(M[k]); return a && b ? a/b : 0; }).filter(x => x > 0.4 && x < 2.5).sort((a,b) => a-b);
    if(R.length >= 15) v = Math.max(0.85, Math.min(1.4, R[Math.floor(R.length/2)])); }
  return (_PEX[store] = Math.round(v*1000)/1000);
}
/* spéciaux des circulaires (toutes tes épiceries) qui correspondent à un article */
function dealsAll(name){
  if(_DCA.has(name)) return _DCA.get(name);
  const man = (S.menu.dsel||{})[artB(name)]; let L = [];
  if(man !== 'none'){ const all = _SPA || (_SPA = allSpecAll().filter(s => isFinite(priceOf(s)))); L = man ? all.filter(s => spId(s)===man) : dealCands(name, prep(all)); }
  _DCA.set(name, L); return L;
}
/* coût d'une ligne dans une épicerie : {cost, reg, src: 'mine'|'robot'|'ref'|'est', deal, rsp} */
function costAt(r, store){
  const key = r.k + '|' + store; if(_CAT_S.has(key)) return _CAT_S.get(key);
  const L = (S.prices||{})[r.k], mine = L && !L.sp && L.pu > 0 && (L.s === store || (!L.s && store === mainStore()));
  let reg, src, line = null;
  if(mine){ reg = costEst(r); src = 'mine'; }
  else if((line = peLine(r, store)) && line.reg != null){ reg = line.reg; src = 'robot'; }
  else { const lm = store !== 'Maxi' ? peLine(r, 'Maxi') : null; reg = (lm && lm.reg != null ? lm.reg : estBase(r)) * ecart(store); src = store === 'Maxi' || !S.stores.includes(store) ? 'ref' : 'est'; if(line && line.cur != null && line.cur > reg) reg = line.cur; }
  let cost = reg, deal = null, rsp = null;
  if(line && line.sp && line.cur < cost - 0.005){ cost = line.cur; rsp = line; }
  dealsAll(r.name).filter(s => s.s === store).forEach(d => { const dc = dealCost(d, r);
    /* moins de 40 % du prix habituel sans rabais annoncé : probablement un prix à la livre ou un autre format */
    if(dc != null && dc < cost - 0.005 && (d.d > 0 || dc <= reg*1.15 || mine) && (dc >= reg*0.4 || d.d >= 55)){ cost = dc; deal = d; rsp = null; } });
  const o = {cost, reg: Math.max(reg, cost), src, deal, rsp};
  _CAT_S.set(key, o); return o;
}
/* à quelle épicerie va un article : la principale, sauf si une autre de la semaine est nettement moins chère */
function assign(r, stores, main){
  if(stores.length <= 1) return stores[0] || main;
  let best = stores.includes(main) ? main : stores[0], bc = costAt(r, best).cost;
  stores.forEach(s => { if(s === best) return; const c = costAt(r, s).cost; if(c < bc*0.97 && bc - c >= 0.25){ best = s; bc = c; } });
  return best;
}
/* ---------- comparateur : une, deux, trois ou quatre épiceries ---------- */
const STORE_MAX = 6;
function comparer(rows){
  if(_CMPR && _CMPR.rows === rows) return _CMPR.res;
  const R = rows.filter(r => !S.menu.chk[r.k]);
  let st = S.stores.length ? S.stores.slice() : [mainStore()];
  const single = s => { let t = 0, ok = 0; R.forEach(r => { const c = costAt(r, s); t += c.cost; if(c.src !== 'est' || c.deal || c.rsp) ok += c.cost; }); return {stores:[s], total:t, real: t ? ok/t : 1}; };
  const singles = st.map(single).sort((a,b) => a.total - b.total);
  if(st.length > STORE_MAX) st = singles.slice(0, STORE_MAX).map(x => x.stores[0]);
  const best1 = singles[0], combos = [];
  const subsets = (k, from = 0, cur = []) => { if(cur.length === k){ combos.push(cur.slice()); return; } for(let i = from; i < st.length; i++){ cur.push(st[i]); subsets(k, i+1, cur); cur.pop(); } };
  for(let k = 2; k <= Math.min(4, st.length); k++) subsets(k);
  const multi = combos.map(C => {
    const main = C.includes(S.p.main) ? S.p.main : singles.find(x => C.includes(x.stores[0])).stores[0];
    const per = {}; let t = 0; C.forEach(s => per[s] = {n:0, t:0});
    R.forEach(r => { const s = assign(r, C, main), c = costAt(r, s).cost; per[s].n++; per[s].t += c; t += c; });
    return {stores:C, main, total:t, per, used: C.every(s => per[s].n > 0)};
  }).filter(x => x.used);
  const bestK = [];
  for(let k = 2; k <= 4; k++){ const L = multi.filter(x => x.stores.length === k).sort((a,b) => a.total - b.total); if(L.length && best1.total - L[0].total >= 2 && (!bestK.length || bestK[bestK.length-1].total - L[0].total >= 2)) bestK.push(L[0]); }
  const res = {rows:R, singles, multi:bestK, best:best1};
  _CMPR = {rows, res}; return res;
}
const goKey = L => L.slice().sort().join('|');
/* choisir les épiceries de la semaine (une ou plusieurs) */
function choisirEpiceries(L){
  L = L.filter(s => S.stores.includes(s)); if(!L.length) return;
  S.skip = S.stores.filter(s => !L.includes(s)); S.goSome = L.length > 1 && L.length < S.stores.length; S.goAuto = false;
  if(L.length > 1) S.p.grp = 'magasin';
}
function ouAllerCard(rows){
  if(S.stores.length < 2 || !rows.length) return '';
  const C = comparer(rows), cur = goKey(goStores()), b = C.best;
  const pct = x => Math.round(x*100);
  const opt = (o, extra) => { const on = goKey(o.stores) === cur, lbl = o.stores.length === 1 ? `${o.stores[0]} seulement` : o.stores.join(' + ');
    return `<div class="item ou${on ? ' on' : ''}"><span class="t"><b>${esc(lbl)}</b>${extra}</span><span class="qcol"><span class="q">≈ ${money(o.total * calF())}</span>${on ? '<span class="small ok">Ton choix</span>' : `<button class="btn s" data-a="ou_pick" data-v="${esc(o.stores.join('|'))}">Choisir</button>`}</span></div>`; };
  let h = `<div class="card ouc"><h3>Où faire l'épicerie cette semaine</h3><p class="small">Le coût de ta liste dans chacune de tes épiceries, spéciaux et prix réguliers compris.</p><div class="list">`;
  C.singles.forEach((o, i) => { h += opt(o, `<small>${i === 0 ? 'La moins chère pour une seule épicerie' : `${money((o.total - b.total) * calF())} de plus`}${o.real < 0.6 ? ' · surtout estimé' : ` · prix connus pour ${pct(o.real)} %`}</small>`); });
  C.multi.forEach(o => { const det = o.stores.filter(s => s !== o.main).map(s => `${s} : ${o.per[s].n} article${o.per[s].n>1?'s':''}`).join(', ');
    h += opt(o, `<small class="ok"><b>${money((b.total - o.total) * calF())} de moins</b> que ${esc(b.stores[0])} seulement</small><small>Le reste chez ${esc(o.main)}; ${esc(det)}.</small>`); });
  if(!C.multi.length) h += `<p class="small">Aller à plus d'une épicerie ferait économiser moins de 2 $ cette semaine.</p>`;
  const pd = peDate();
  h += `</div><p class="small">À toi de voir si l'économie vaut le déplacement. ${pd ? `Prix réguliers relevés le ${esc(dShort(pd))} chez ${esc(PE.magasins.filter(m => m.ok || m.n).map(m => m.ch === 'maxi' ? 'Maxi' : 'IGA').filter((x, i, a) => a.indexOf(x) === i).join(' et '))}` : 'Pas encore de relevé des prix'}; ailleurs, prix estimés d'après l'écart habituel avec Maxi, corrigés par les prix que tu inscris.</p></div>`;
  return h;
}
/* ligne « Où aller » dans Ma semaine */
function ouAllerLigne(rows){
  if(S.stores.length < 2 || !rows.length) return '';
  const C = comparer(rows), b = C.best, m = C.multi[0], go = goStores();
  const cur = C.singles.concat(C.multi).find(o => goKey(o.stores) === goKey(go));
  let t = `Le moins cher pour une seule épicerie : <b>${esc(b.stores[0])}</b> (≈ ${money(b.total*calF())}).`;
  if(m) t += ` ${esc(m.stores.join(' + '))} : ${money((b.total - m.total)*calF())} de moins.`;
  if(cur && goKey(cur.stores) !== goKey(b.stores) && cur.total > b.total + 2 && !m || (cur && m && cur.total > Math.min(b.total, m.total) + 2)) t += ` Ton choix actuel coûte ≈ ${money((cur.total - Math.min(b.total, m ? m.total : b.total))*calF())} de plus.`;
  return `<p class="small">${t} <a href="#" data-a="view" data-v="epicerie">Comparer</a></p>`;
}
/* ---------- relevé : carte dans Prix ---------- */
function peCard(){
  const pd = peDate(), sel = peSel();
  const mags = PE ? PE.magasins : [];
  const lig = mags.map(m => `<li>${esc(m.nom)} : ${m.ok ? `${m.n} articles` : `<span class="over">échec du dernier relevé</span>${m.n ? ` (prix du ${esc(dShort(m.d || pd))} gardés)` : ''}`}</li>`).join('');
  const igas = mags.filter(m => m.ch === 'iga');
  return `<div class="card"><h3>Prix des épiceries</h3>
    <p class="small">${pd ? `Un robot relève chaque semaine les prix réguliers et les promotions de Maxi et d'IGA. Dernier relevé : <b>${esc(fmtDate(pd))}</b>.` : "Le relevé automatique des prix n'est pas encore disponible."} Les autres épiceries sont estimées d'après leur écart habituel avec Maxi; tes prix payés les corrigent.</p>
    ${lig ? `<ul class="todo">${lig}</ul>` : ''}
    ${igas.length > 1 ? `<label class="f">Ton IGA<select data-a="pe_mag" data-ch="iga">${igas.map(m => `<option value="${esc(m.id)}" ${sel.iga === m.id ? 'selected' : ''}>${esc(m.nom)}</option>`).join('')}</select></label>` : ''}
    ${S.stores.filter(s => s !== 'Maxi').length ? `<p class="small">Écart avec Maxi : ${S.stores.filter(s => s !== 'Maxi').map(s => `${esc(s)} ${ecart(s) >= 1 ? '+' : '−'}${Math.round(Math.abs(ecart(s) - 1)*100)} %${peData(s) ? '' : ' (estimé)'}`).join(' · ')}</p>` : ''}
    <div class="acts"><button class="btn s p" data-a="pe_maj" ${peBusy ? 'disabled' : ''}>Mettre à jour les prix maintenant</button></div><p class="note" id="pe_msg" hidden></p></div>`;
}
/* sous un article de Prix : le prix relevé dans chaque chaîne */
function peTxt(b){
  if(!PE) return '';
  const k = bxKey(b), L = Object.keys(CHAINES).map(s => { const D = peData(s), e = D && D[k]; if(!e) return '';
    if(e.kg) return `${s} ${e.kg[0] != null ? money(e.kg[0]) + '/kg' : ''}${e.kg[1] > 0 ? ` (promo ${money(e.kg[1])}/kg)` : ''}`;
    return `${s} ${e.f.map(x => `${fq(x[0], b[1].u)} ${x[1] != null ? money(x[1]) : ''}${x[2] > 0 ? ` (promo ${money(x[2])})` : ''}`).join(', ')}`; }).filter(Boolean);
  return L.length ? `<small>Relevé : ${esc(L.join(' · '))}</small>` : '';
}
