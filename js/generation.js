/* Menu de la semaine — Génération du menu, budget, recherche des circulaires (Flipp).
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
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
  const m = S.menu, shop = shopISO(), start = startFrom(shop), nm = {date:fmtDate(start), start, shop, chk:{}, extra:{}, achete:false, snap:null, useup:m.useup||{}, sn:m.date ? (m.sn||[]) : [], dinCook:{}, dinNo:{}, dsel:m.dsel||{}};
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
  if(!S.stores.length){ say('Choisis d\'abord tes épiceries dans Profil.'); return; }
  if(!cp){ say('Entre d\'abord ton code postal dans Profil.'); return; }
  if(!cpOk(cp)){ say('Code postal invalide dans Profil (exemple : G6V 6Z3).'); return; }
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
