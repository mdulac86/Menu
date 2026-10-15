/* Menu de la semaine — Variété, jours de la semaine, dîners et restes.
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
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
    { const w0 = weekStart(); L.forEach(x => { c += .5 * perishOf(R(x)) * Math.max(0, gapDays(w0, x.d)); }); }
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
