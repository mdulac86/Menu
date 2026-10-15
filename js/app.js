/* Menu de la semaine — Navigation, actions et démarrage (chargé en dernier).
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
/* ---------- navigation et rendu global ----------
   5 onglets en bas (groupes), chacun avec ses sous-menus en haut (vues). `tab` = la vue affichée. */
let tab = 'semaine';
const GROUPS = {semaine:['semaine'], menu:['menu','historique'], epicerie:['epicerie','articles','prix','maison'], recettes:['recettes'], profil:['famille','horaire','epiceries','budget','sauvegarde','apparence','aide']};
const VLBL = {menu:'Semaine', historique:'Historique', epicerie:'Liste', articles:'Articles', prix:'Prix', maison:'Maison', famille:'Famille', horaire:'Horaire', epiceries:'Épiceries', budget:'Budget et prix', sauvegarde:'Sauvegarde', apparence:'Apparence', aide:'Aide'};
const SECTIONS = ['semaine','menu','historique','epicerie','articles','prix','maison','recettes','profil'];
const groupOf = v => Object.keys(GROUPS).find(g => GROUPS[g].includes(v));
const secOf = v => GROUPS.profil.includes(v) ? 'profil' : v;
const lastView = {};
const RENDER = {semaine:() => renderSemaine(), menu:() => renderMenu(), historique:() => renderReglages(), epicerie:() => renderEpicerie(), articles:() => renderArticles(), prix:() => renderPrixTab(), maison:() => renderMaison(), recettes:() => renderRecettes(), aide:() => renderAide()};
GROUPS.profil.filter(v => v!=='aide').forEach(v => RENDER[v] = () => renderReglages());
function renderView(){ (RENDER[tab] || renderSemaine)(); const nav = subNav(groupOf(tab)); if(nav) $('#tab-'+secOf(tab)).insertAdjacentHTML('afterbegin', nav); }
function subNav(g){ const L = GROUPS[g]; if(L.length < 2) return '';
  return `<div class="seg subnav" role="tablist" aria-label="Sous-menus">${L.map(v => `<button role="tab" class="${v===tab?'on':''}" data-a="view" data-v="${v}" aria-selected="${v===tab}">${esc(VLBL[v])}</button>`).join('')}</div>`; }
function renderPrixTab(){ $('#tab-prix').innerHTML = `<div class="card"><input type="text" id="ar_q" value="${esc(artF.q)}" placeholder="Chercher un article" aria-label="Chercher un article" autocomplete="off"></div>` + prixView(); }
/* Apparence : claire par défaut, sombre ou comme le téléphone au choix (Profil). */
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
  if(!groupOf(tab)) tab = 'semaine';
  const g = groupOf(tab); lastView[g] = tab;
  (RENDER[tab] || renderSemaine)();
  const sec = secOf(tab);
  SECTIONS.forEach(t => { const el = $('#tab-'+t); if(el) el.hidden = t!==sec; });
  const nav = subNav(g); if(nav) $('#tab-'+sec).insertAdjacentHTML('afterbegin', nav);
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t===g));
  { const tb = $('#testbar'); if(tb) tb.hidden = !TEST; document.body.classList.toggle('test', TEST); }
  const n = S.menu.date ? buyList().rows.filter(r => !S.menu.chk[r.k]).length : 0;
  const bg = $('#bgl'); bg.hidden = !n; bg.textContent = n;
  if(cook) renderCook();
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; const g = b.dataset.t; tab = groupOf(tab)===g ? GROUPS[g][0] : (lastView[g] || GROUPS[g][0]); render(); window.scrollTo(0,0); });

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
  S.hist.push({start:S.menu.start||'', est:S.menu.est||0, date:S.menu.date, items:S.menu.items.map(x => ({r:x.r, v:x.v, sf:x.sf||'', sv:x.sv||''})), din:mlist('din').map(x => ({r:x.r, v:x.v, sf:x.sf||'', sv:x.sv||''})), dej:mlist('dej').map(x => ({r:x.r, v:x.v})), ent:mlist('ent').map(x => ({r:x.r, v:x.v})), sou:mlist('sou').map(x => ({r:x.r, v:x.v})), des:mlist('des').map(x => ({r:x.r, v:x.v})), paid:S.menu.paid||0});
  S.hist = S.hist.slice(-26);
  S.menu = {date:'', items:(S.report||[]).map(x => Object.assign({}, x, {lock:true, rep:true})), din:[], dej:[], dinCook:{}, dinNo:{}, dsel:{}, ent:[], sou:[], des:[], chk:{}, extra:{}, achete:false, snap:null, useup:{}};
  S.report = [];
  S.spec = [];
  S.dates.shop = ''; S.dates.man = false;   /* la prochaine semaine repart du prochain jour de ramassage */
  save(); tab = 'menu'; render(); window.scrollTo(0,0);
}
function epicerieFaite(){
  const {rows} = buyList();
  rows.forEach(r => {
    if(!S.menu.chk[r.k]) return;
    const q = Math.max(r.buy, r.def||0), o = S.stock[r.k]; if(o) o.q += q; else S.stock[r.k] = {name:r.name, u:r.u, q, rayon:r.rayon};
  });
  S.menu.snap = (S.menu.snap||[]).filter(x => x.ok).concat(rows.map(r => ({name:r.name, u:r.u, buy:r.buy, ok:!!S.menu.chk[r.k]})));
  S.menu.est = Math.round(((S.menu.achete ? (S.menu.est || 0) : 0) + listTotals(rows.filter(r => S.menu.chk[r.k])).raw) * 100) / 100;
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
  if(id==='pf_export'){ exportProfil(); return; }
  if(id==='frigo_share'){ partagerFrigo(); return; }
  if(id==='frigo'){ menuFrigo().catch(() => setSync("L'image n'a pas pu être créée.")); return; }
  if(id==='prep_week'){ if(prepBusy) return; if(S.menu.date && S.menu.start <= isoToday() && t.dataset.armed!=='1'){ arm(t, 'Confirmer : préparer la prochaine semaine', () => {}); return; } t.disabled = true; preparerSemaine().catch(e => setSync('Petit problème : ' + (e.message||'erreur'))); return; }
  if(id==='test_copy'){ arm(t, 'Confirmer : remplacer les données de test', () => { const msg = $('#test_msg'); try{ restoreFrom(localStorage.getItem(REAL_KEY), 'Vraies données copiées dans la version de test.'); profil(); appliquerProfil(); save(); render(); }catch(e){ if(msg){ msg.textContent = 'La copie a échoué : ' + (e.message||'erreur') + '. Rien n\'a été changé.'; msg.hidden = false; } } }); return; }
  if(id==='setup_done'){ profil(); appliquerProfil(); wiz = 0; S.setup = true; if(wizEss && !S.ess.length) S.ess = ESS_START(); save(); render(); window.scrollTo(0,0); return; }
  if(id==='ess_preset'){ S.ess = ESS_START(); save(); render(); return; }
  if(id==='gen'){ if(S.menu.date && t.dataset.armed!=='1'){ arm(t,'Confirmer', ()=>{}); return; } genMenu(); return; }
  if(id==='addbtn'){ const r = byName($('#addsel').value); if(r){ addToMenu(r); save(); render(); } return; }
  if(id==='fin'){ if(S.menu.start && S.menu.start > isoToday()) return; arm(t,'Confirmer : terminer la semaine', terminerSemaine); return; }
  if(id==='achete'){ arm(t, Object.values(S.menu.chk||{}).some(Boolean) ? 'Confirmer : épicerie terminée' : 'Rien de coché : confirmer quand même ?', epicerieFaite); return; }
  if(id==='spadd'){ ajouterSpeciaux(); return; }
  if(id==='spclr'){ S.spec = []; save(); render(); return; }
  if(id==='hclr'){ arm(t,'Confirmer', () => { S.hist = []; save(); render(); }); return; }
  if(id==='reset'){ arm(t,'Confirmer : tout effacer', () => { if(!snapshot('Avant la remise à zéro', JSON.stringify(S))){ setSync("Espace plein : enregistre d'abord une sauvegarde dans Fichiers (Profil)."); return; } S = DEFAULT(); S.appv = APPV; loadFailed = false; rescued = false; save(); render(); }); return; }
  if(id==='help_btn'||id==='help_open'){ tab='aide'; S.help=true; save(); render(); window.scrollTo(0,0); return; }
  if(id==='help_hide'){ S.help=true; save(); render(); return; }
  if(id==='help_back'){ tab='semaine'; render(); window.scrollTo(0,0); return; }
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
    if(a==='malts'){ altKey = altKey===ml+'|'+i ? '' : ml+'|'+i; render(); return; }
    if(a==='mpick'){ const nr = byName(t.dataset.r); if(!nr) return; const others = L.filter((_,j) => j!==i); others.forEach(x => { if(x.after===it.r) delete x.after; });
      const ni = (ml==='items' || ml==='din') ? mkItem(nr, usedSides(others), pickVar(nr)) : {r:nr.n, v:pickVar(nr)}; if(it.d) ni.d = it.d; if(it.dfix) ni.dfix = true; if(it.pt) ni.pt = it.pt;
      L[i] = ni; altKey = ''; save(); render(); return; }
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
  if(a==='bk_go'){ tab = 'sauvegarde'; render(); const c = document.getElementById('sauvegarde'); if(c) c.scrollIntoView({block:'start'}); return; }
  if(a==='bk_hide'){ bkBar = false; render(); return; }
  if(a==='bk_later'){ S.bkSnooze = addDays(isoToday(), 14); save(); render(); return; }
  if(a==='theme'){ S.p.theme = t.dataset.v; save(); render(); return; }
  if(a==='stx_rm'){ e.preventDefault(); const s = t.dataset.s; S.storesx = (S.storesx||[]).filter(x => x!==s); S.stores = S.stores.filter(x => x!==s); save(); render(); return; }
  if(a==='ar_go'){ e.preventDefault(); const b = t.dataset.b; tab = 'articles'; artF = {q:'', f:'week'}; openPan.add('art|'+b); render(); const d = document.querySelector(`details.art[data-b="${CSS.escape(b)}"]`); if(d) d.scrollIntoView({block:'start'}); return; }
  if(a==='view'){ tab = t.dataset.v; render(); window.scrollTo(0,0); return; }
  if(a==='pf_ok'){ if(S.profil) delete S.profil.verifier; save(); render(); return; }
  if(a==='pf_add'){ profil().membres.push(t.dataset.v==='adulte' ? {a:'adulte', ap:'normal', l:true} : {a:'enfant', age:10, ap:'normal', l:true}); appliquerProfil(); ajuster(); save(); render(); return; }
  if(a==='pf_rm'){ const P = profil(); if(P.membres.length > 1) P.membres.splice(+t.dataset.i, 1); appliquerProfil(); ajuster(); save(); render(); return; }
  if(a==='wiz'){ wiz = Math.max(0, Math.min(4, wiz + (+t.dataset.v||0))); if(wiz===3) appliquerProfil(); save(); render(); window.scrollTo(0,0); return; }
  if(a==='ar_f'){ artF.f = t.dataset.v; render(); return; }
  if(a==='pm_go'){ e.preventDefault(); tab = 'prix'; artF.q = ''; render(); window.scrollTo(0,0); return; }
  if(a==='pm_snooze'){ pmaj().snooze = addDays(isoToday(), 7); save(); render(); return; }
  if(a==='pm_done'){ const p = pmaj(); p.d = isoToday(); delete p.snooze; save(); render(); const mm = $('#pm_msg'); if(mm){ mm.textContent = 'Prix à jour. Prochain rappel dans un mois.'; mm.hidden = false; } return; }
  if(a==='pm_reset'){ e.preventDefault(); if(S.bx) delete S.bx[t.dataset.k]; save(); render(); return; }
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
  if(a==='cmdmode'){ S.p.cmd = t.dataset.v==='1'; save(); render(); return; }
  if(a==='rayup'){ const o = rayOrder(), j = +t.dataset.j; if(j > 0){ [o[j-1], o[j]] = [o[j], o[j-1]]; profil().rayons = o; save(); render(); } return; }
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
  { const t0 = e.target; if(t0 && t0.dataset && t0.dataset.ib !== undefined && t0.dataset.j !== undefined){ const d0 = drafts[t0.dataset.ib], x0 = d0 && d0.rows && d0.rows[+t0.dataset.j]; if(x0 && x0.doute){ x0.doute = ''; const w0 = t0.closest('.ibw'); if(w0){ w0.classList.remove('doute'); const s0 = w0.querySelector('.dt'); if(s0) s0.remove(); } } } }
  const t = e.target;
  if(t.dataset.ck && cook){ const o = ckRead(), x = o[cook.key] = o[cook.key] || {c:{}}; x.ts = Date.now(); x.c = x.c || {};
    if(t.checked) x.c[t.dataset.ck] = 1; else delete x.c[t.dataset.ck]; ckWrite(o); ckProgress(); return; }
  if(bindDraft(t)) return;
  if(t.classList.contains('ib_u') || t.classList.contains('ib_ray')){ const d = drafts[t.dataset.ib], x = d && d.rows[+t.dataset.j]; if(x){ if(t.classList.contains('ib_u')) x.u = t.value; else x.ray = t.value; } return; }
  if(t.classList.contains('ib_n')){ const d = drafts[t.dataset.ib], x = d && d.rows[+t.dataset.j]; if(x){ x.n = t.value.trim(); const c = catFind(x.n), w = t.closest('.ibw');
      if(c){ x.ray = c.ray; if(!x.q){ x.u = c.u; w.querySelector('.ib_u').value = c.u; } w.querySelector('.ib_rw').innerHTML = ''; } else w.querySelector('.ib_rw').innerHTML = x.n ? rayPick(t.dataset.ib, +t.dataset.j, x) : ''; } return; }
  if(t.id==='an'){ anFill(catFind(t.value), true); return; }
  if(t.dataset.p){ S.p[t.dataset.p] = numIn(t.value); ajuster(); save(); render(); return; }
  if(t.dataset.ps){ S.p[t.dataset.ps] = t.value; if(t.dataset.ps==='main' && S.profil) profil().princ = t.value; save(); render(); return; }
  if(t.dataset.pf){   /* profil : membre de la famille ou épicerie principale */
    const P = profil(), f = t.dataset.pf;
    if(f==='princ'){ P.princ = t.value; S.p.main = t.value; }
    else { const m = P.membres[+t.dataset.i]; if(!m) return;
      if(f==='a') m.a = t.value==='adulte' ? 'adulte' : 'enfant';
      else if(f==='age'){ const v = parseInt(t.value, 10); m.age = v >= 0 && v < 25 ? v : m.age; }
      else if(f==='ap') m.ap = t.value;
      else if(f==='l') m.l = t.checked; }
    appliquerProfil(); ajuster(); save(); render(); return; }
  if(t.dataset.pj){ profil().jours[t.dataset.pj] = Math.max(0, Math.min(6, +t.value || 0)); save(); render(); return; }
  if(t.dataset.pfb){ profil()[t.dataset.pfb] = t.checked; save(); render(); return; }
  if(t.id==='pf_file' && t.files && t.files.length){ const fr = new FileReader(); fr.onload = () => { const msg = $('#pf_msg'); try{ importProfil(String(fr.result)); const m2 = $('#pf_msg'); if(m2){ m2.textContent = 'Profil chargé. Tes données d\'avant sont gardées dans les copies automatiques.'; m2.hidden = false; } }catch(e){ if(msg){ msg.textContent = e.message==='espace' ? "Espace plein : enregistre d'abord une sauvegarde." : "Ce fichier n'est pas un profil valide. Rien n'a été changé."; msg.hidden = false; } } }; fr.readAsText(t.files[0]); t.value = ''; return; }
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
  if(t.dataset.prep !== undefined){ S.menu.prep = Object.assign({}, S.menu.prep, {[t.dataset.prep]: t.checked}); save(); return; }
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
  if(t.id==='d_shop'){ S.dates.shop = t.value; S.dates.man = !!t.value; save(); render(); return; }
  if(t.id==='relay_in'){ S.relay = t.value.trim(); save(); return; }
  if(t.id==='p_cool'){ S.p.cool = +t.value; save(); }
  if(t.classList && t.classList.contains('pm_in')){   /* prix inscrit dans « Mise à jour des prix » */
    const k = t.dataset.k, raw = String(t.value).trim(), v = parseFloat(raw.replace(/[\s$]/g,'').replace(',','.'));
    if(raw && !(v > 0 && v < 1000)){ t.value = ''; return; }
    S.bx = isObj(S.bx) ? S.bx : {}; const o = S.bx[k] = Object.assign({}, S.bx[k]);
    if(t.dataset.kg) { if(raw) o.kg = v; else delete o.kg; }
    else { o.f = Array.isArray(o.f) ? o.f : []; o.f[+t.dataset.i] = raw ? v : null; if(!o.f.some(x => x > 0)) delete o.f; }
    if(o.f || o.kg) o.d = isoToday(); else delete S.bx[k];
    save(); return; }
  if(t.id==='pm_pct'){ const v = parseFloat(String(t.value).replace(/[\s%]/g,'').replace(',','.')); pmaj().pct = isFinite(v) ? Math.max(-50, Math.min(100, v)) : 0; save(); render(); return; }
  if(t.id==='su_ess'){ wizEss = t.checked; return; }
  if(t.id==='pm_rappel'){ pmaj().rappel = t.checked; save(); return; }
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
  if(t.id==='ar_q'){ artF.q = t.value; const pos = t.selectionStart; renderView(); const f = $('#ar_q'); if(f){ f.focus(); f.setSelectionRange(pos, pos); } return; }
  if(t.id==='pk_q'){ pick.q = t.value; pick.msg = ''; const box = $('#pk_res'); if(box) box.innerHTML = pickRows(t.value); return; }
  if(t.id==='an'){ const box = $('#an_sugg'); if(box) box.innerHTML = sugBtns(catSearch(t.value, 8), 'data-a="an_pick"'); return; }
});
document.addEventListener('input', e => { if(e.target.id==='rfilt'){ rf.q = e.target.value; const pos = e.target.selectionStart; renderRecettes(); const f = $('#rfilt'); f.focus(); f.setSelectionRange(pos,pos); return; } });
document.addEventListener('input', e => { if(e.target.id==='filt'){ filtre = e.target.value; const pos = e.target.selectionStart; renderMaison(); const f = $('#filt'); f.focus(); f.setSelectionRange(pos,pos); } });


/* ---------- aide ---------- */
function renderAide(){
  const D = (t, body, open) => `<details class="card help" ${open?'open':''}><summary>${t}</summary>${body}</details>`;
  $('#tab-profil').innerHTML = `<button class="btn" id="help_back">← Retour à Ma semaine</button>
  <div class="card"><h3>À quoi sert cette application</h3><p>Elle planifie les déjeuners, les dîners, les soupers, les entrées, les soupes et les desserts de la semaine, tient compte des spéciaux de tes épiceries et de ce qu'il y a déjà à la maison, et produit <b>une seule liste d'épicerie complète</b>. Tes données restent sur ton téléphone.</p></div>`
  + D("1. Installer l'application sur l'iPhone", `<ol><li>Ouvre l'adresse de l'application dans <b>Safari</b> (pas dans Messenger ni une autre application).</li>
    <li>Touche <b>Partager</b> (le carré avec une flèche vers le haut), fais défiler la liste d'actions jusqu'à <b>Sur l'écran d'accueil</b>, puis touche <b>Ajouter</b>.</li>
    <li>Ouvre toujours l'application par <b>son icône</b>.</li></ol>
    <div class="warn"><b>Installe avant d'entrer quoi que ce soit.</b> Safari et l'icône de l'écran d'accueil ne partagent pas leurs données.</div>
    <div class="tip">Chaque personne installe l'application sur son téléphone. Les données ne sont pas partagées entre téléphones (voir la section 11).</div>`, true)
  + D('2. Première configuration', `<p>Au premier lancement, un assistant en 5 étapes décrit ta famille :</p>
    <ul><li><b>La famille</b> : adultes et enfants (avec leur âge), l'appétit de chacun et qui apporte un lunch. Les portions et les restes pour les lunchs en découlent.</li>
    <li><b>L'horaire</b> : le jour où tu planifies, où tu commandes, où tu ramasses l'épicerie et où vous commencez à cuisiner.</li>
    <li><b>Les épiceries</b> : ton code postal, celles où tu vas et ta principale. La liste se fait à la principale; l'application t'avertit quand une autre est nettement plus avantageuse.</li>
    <li><b>Les repas</b> à planifier et, si tu veux, une liste de départ pour les déjeuners, lunchs, collations et boissons.</li>
    <li><b>Le budget</b> de la semaine.</li></ul>
    <p>Tout se change ensuite dans l'onglet <b>Profil</b>. Le profil peut être enregistré dans Fichiers (Profil → Sauvegarde) pour le réinstaller ou le donner à un proche.</p>`)
  + D('Ta semaine en 4 étapes', `<ol><li><b>Planifier</b> (mercredi soir ou jeudi) : dans Ma semaine, touche <b>Préparer ma semaine</b>. L'application lit les circulaires pour la date du ramassage, fait un menu varié du dimanche au samedi qui en profite, respecte le budget et prépare la liste.</li>
    <li><b>Commander</b> : Épicerie → <b>Commande en ligne</b>. Chaque article a un lien vers le site de l'épicerie et le format à commander. Ouvre-le, ajoute au panier, reviens et coche.</li>
    <li><b>Ramasser</b> : touche « Épicerie terminée », puis inscris le total de la facture. Après quelques semaines, l'estimation du coût se corrige d'elle-même.</li>
    <li><b>Cuisiner</b> : la carte <b>Préparation</b> regroupe ce qui se fait d'avance (hacher, cuire le riz, mariner, congeler). Chaque soir, la carte <b>Aujourd'hui</b> montre le repas et le bouton Cuisiner.</li></ol>
    <div class="tip">Les poissons et la viande hachée sont placés en début de semaine, les plats du congélateur et du garde-manger à la fin.</div>`)
  + D('3. Faire le menu de la semaine', `<ol>
    <li>Règle les dates : <b>Je planifie le</b> et <b>J'achète le</b>. Les spéciaux retenus sont ceux valides le jour de l'épicerie.</li>
    <li>Tu ne vas qu'à une de tes épiceries cette semaine, ou tu commandes en ligne ? Sur la carte de la semaine, choisis <b>Cette semaine, je fais l'épicerie : Seulement chez Maxi</b> (par exemple). Le menu suit les spéciaux de Maxi, et la liste, les prix, « Moins cher ailleurs » et les aubaines ne parlent que de Maxi. Une petite note dit seulement combien tu sauverais ailleurs, sans rien changer. « Dans quelques-unes… » permet d'en cocher plusieurs. La liste complète de tes épiceries se change dans Profil.</li>
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
  + D("4. Les jours de la semaine et la carte Aujourd'hui", `<ul><li>Dans Profil, coche tes <b>jours de congé</b>. Les soupers plus longs y sont placés; les jours de travail reçoivent les plats rapides (<b>Temps max. en semaine</b>, 35 min par défaut).</li>
    <li>Les plats « à la mijoteuse » se préparent le matin en 15 minutes : ils vont bien un jour de travail.</li>
    <li>La carte <b>Aujourd'hui</b>, en haut du Menu, montre le déjeuner, le dîner et le souper du jour, celui de demain, avec les rappels : sortir la viande du congélateur la veille, partir la mijoteuse le matin, garder des restes.</li>
    <li><b>Cuisiner</b> ouvre la recette en grand : ingrédients pour tes portions (avec la sauce et les accompagnements) et étapes à cocher. L'écran reste allumé. Sur chaque plat du menu, <b>Recette</b> ouvre la même vue pour y jeter un coup d'œil pendant la planification.</li></ul>`)
  + D('5. Déjeuners, dîners et restes', `<ul><li><b>Déjeuners</b> : ils ont leur section dans Recettes (crêpes, galettes de sarrasin, pain doré, déjeuner de cabane, gruau de nuit…). Les plus longs vont aux jours de congé. Les céréales, rôties et cafés de tous les jours restent dans la liste « Déjeuners, lunchs » de Profil.</li>
    <li><b>Dîners</b> : chaque souper est cuisiné avec des portions de plus (Profil, « Portions de restes »). Le midi suivant, le dîner, ce sont ces restes : rien à acheter. Les jours sans restes, l'application choisit une recette de la banque des soupers, différente de celles de la semaine, pour les portions d'un dîner.</li>
    <li>Sur un jour de restes, <b>Préparer un dîner à la place</b> ajoute une recette. Sur un dîner cuisiné, <b>Manger plutôt les restes de…</b> fait l'inverse, et <b>Pas de dîner ce jour-là</b> (sous Plus) le retire.</li>
    <li><b>Ajouter un plat de mon choix</b> : pour une recette de souper, choisis <b>Au souper</b> ou <b>Au dîner</b>, puis le jour.</li>
    <li>La carte <b>Aujourd'hui</b> rappelle de garder les restes du souper pour le dîner du lendemain.</li><li>Quand une grosse pièce est au menu (épaule de jambon, poulet entier, rôti de porc…), un deuxième plat qui utilise ses restes est ajouté plus tard dans la semaine : sandwichs au jambon haché, croque-monsieur, pâtes au jambon, pâté au poulet…</li>
    <li>La carte de la grosse pièce indique <b>Restes prévus pour</b> : la quantité achetée est augmentée en conséquence. Celle du deuxième plat indique <b>Avec les restes de</b> : cet ingrédient n'est pas racheté.</li>
    <li>Le deuxième plat est toujours placé après le premier. Pour ne plus jumeler les plats, décoche l'option dans Profil, carte « Organisation de la semaine ».</li></ul>`)
  + D('6. Plats préparés, collations, entrées et desserts', `<ul><li>Les <b>entrées</b> et les <b>desserts</b> choisis en haut du Menu ont leur section sous les soupers, et leurs ingrédients sont dans la liste d'épicerie.</li>
    <li>La carte <b>Collations en spécial</b> (Menu) propose des fruits, yogourts, fromages, craquelins, barres et autres collations annoncés dans tes circulaires. « Ajouter » en met un paquet dans la liste pour cette semaine seulement. Pour ne plus la voir : Profil, carte « Mes collations ».</li>
    <li>Les <b>plats préparés</b> (pizza, lasagne ou pâté surgelés, poulet rôti ou sushis du comptoir…) portent l'étiquette <b>Prêt à servir</b>, et <b>En spécial</b> quand une de tes circulaires les annonce.</li>
    <li>Dans Profil, choisis : les mettre au menu quand ils sont en spécial (1 par semaine au plus), seulement les suggérer (carte « Plats préparés en spécial » du Menu), les traiter comme les autres plats, ou jamais.</li></ul>`)
  + D('7. Après le repas : on a aimé ou pas', `<p>Le jour même ou après, touche <b>On a aimé</b> ou <b>Pas aimé</b> sur la carte du souper. Un plat aimé revient plus souvent; un plat peu aimé revient moins souvent, et après deux « Pas aimé » il n'est plus proposé automatiquement (tu peux toujours l'ajouter toi-même). Pour l'écarter pour de bon, utilise <b>Je n'aime pas</b>.</p>`)
  + D("8. L'inventaire : ce qu'il y a à la maison", `<ul><li>L'onglet <b>Maison</b> garde ce que tu as. Tout ce qui s'y trouve est déduit de la liste et favorise les plats qui l'utilisent.</li>
    <li><b>Ajouter un article</b> : tape quelques lettres (« fromage », « poulet ») et touche l'aliment proposé. L'unité, le rayon et la catégorie se remplissent tout seuls; il reste à vérifier la quantité. Tu peux aussi <b>choisir par rayon</b>.</li>
    <li>Un aliment que l'application ne connaît pas est accepté : vérifie alors son rayon et sa catégorie. « Féculent » ou « Légume ou salade » en fait un accompagnement possible (un sac de rouleaux de printemps, par exemple).</li>
    <li>Une quantité très petite en grammes (3 g, par exemple) demande une confirmation : c'était peut-être 3 kg ou 3 paquets.</li>
    <li>Tape une quantité exacte ou utilise − et +. À 0, l'article disparaît. « À utiliser cette semaine » (Menu) propose d'utiliser ce qui dort à la maison.</li></ul>`)
  + D("9. Faire l'épicerie une seule fois", `<ol><li>L'onglet <b>Épicerie</b> classe tout <b>par rayon</b> ou <b>par magasin</b>. Par magasin, chaque article va à l'épicerie où il est le moins cher en spécial; le reste va à ton épicerie principale (Profil).</li>
    <li><b>Mode magasin</b> : gros texte, écran qui reste allumé quand le téléphone le permet, et les articles cochés descendent dans « Dans le panier ». Touche <b>Quitter</b> pour revenir.</li>
    <li>« Vérifier avant de partir » rappelle les articles toujours à la maison : touche <b>Il manque</b> au besoin.</li>
    <li>Avec un <b>budget</b> (Profil), l'onglet montre ton budget et le coût estimé des articles en spécial. Au retour, inscris le <b>total payé</b> à la caisse : la moyenne payée s'affiche dans Profil, carte Historique.</li>
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
    <li><b>Soupes et potages</b> : un genre à part, pour les lunchs ou en entrée. Choisis combien en faire par semaine sur la carte de la semaine ou dans Profil.</li>
    <li><b>Sauces</b> : des compléments, pas des repas. Ouvre un souper du menu et choisis une « Sauce en complément » (sauce au poivre avec un steak, par exemple), ou touche <b>Ajouter à un plat du menu</b> dans la recette de la sauce. Ses ingrédients vont dans la liste d'épicerie.</li>
    <li><b>Nouvelle recette</b>, <b>Modifier la recette</b> et les versions utilisent le même formulaire guidé : pour chaque ingrédient, tape quelques lettres, touche l'aliment proposé, puis indique la quantité et l'unité dans les menus. Le rayon se remplit tout seul; pour un aliment nouveau, l'application demande dans quel rayon il se trouve.</li>
    <li><b>Ajouter une version</b> ou <b>Modifier cette version</b> : coche les ingrédients à retirer, ajoute ceux qui changent, choisis l'accompagnement et écris la préparation propre à cette version. « Retirer cette version » la cache, « Rétablir les variantes d'origine » annule tes changements.</li>
    <li>Ce que tu tapes dans un formulaire reste là même si tu changes d'onglet. Un message sous le formulaire indique ce qui manque (un nom, une quantité…).</li>
    <li>Les soupers sont écrits pour 6 portions et ajustés à tes portions; les entrées et desserts donnent environ 6 à 8 portions.</li></ul>`)
  + D('13. Si la recherche des spéciaux ne fonctionne pas', `<ul><li>Vérifie tes épiceries et ton code postal dans Profil.</li>
    <li>Si le navigateur bloque la requête, copie le texte d'une circulaire (<a href="https://flipp.com/fr-ca" target="_blank" rel="noopener">Flipp</a>) et colle-le dans « Si la recherche ne fonctionne pas ».</li>
    <li>Sans spéciaux, tout fonctionne : le menu est simplement choisi sans les rabais.</li></ul>`)
  + D('14. Sauvegarder', `<ul><li>Les données sont enregistrées sur ce téléphone à chaque action. <b>Une mise à jour de l'application ne les touche pas</b> : elle remplace seulement le code, et chaque nouvelle version lit les données de l'ancienne.</li>
    <li>Par sécurité, l'application garde une <b>copie automatique</b> avant chaque mise à jour et une fois par jour (les 5 dernières, dans Profil → Sauvegarde). Si une version n'arrive pas à lire tes données, elle les met de côté au lieu de les effacer.</li>
    <li>Ce qui peut effacer les données : supprimer l'icône de l'écran d'accueil, effacer les données des sites dans les réglages de l'iPhone, ou ouvrir l'application à une autre adresse. Garde la même adresse et ne supprime pas l'icône.</li>
    <li>Pour être protégé même dans ces cas : Profil → <b>Enregistrer une copie dans Fichiers</b>, puis « Enregistrer dans Fichiers ». Fais-le après avoir rempli ton garde-manger, puis une fois par mois. Pour revenir en arrière : « Restaurer une copie » et choisis le fichier.</li></ul>`)
  + D("15. Articles : corriger un spécial, convertir une mesure", `<ul><li>L'onglet <b>Articles</b> montre le spécial associé à chaque article de ta liste (« Ma liste »), de tous les articles connus (« Tous ») ou de ceux que tu as modifiés.</li>
    <li>Un spécial n'est pas le bon ? Touche « Pas le bon ? » sous l'étiquette jaune dans la liste, ou ouvre l'article. Choisis un autre spécial, « Aucun spécial cette semaine », ou cherche le bon dans les circulaires : « Cette semaine » l'associe jusqu'à la fin de la semaine, « Toujours » retient ce produit pour les prochaines semaines.</li>
    <li>Tu peux aussi changer les <b>mots recherchés</b> (une virgule sépare deux façons de le nommer), ajouter des <b>mots à exclure</b> (pané, assaisonné…), choisir le <b>rayon</b>, le <b>format du paquet</b> et le <b>prix habituel</b>.</li>
    <li>À chaque recherche des spéciaux, le prix trouvé est noté. Quand un article n'est pas en spécial, la liste dit à quel prix il l'est souvent.</li>
    <li>Le <b>convertisseur</b> passe des g aux lb, des ml aux tasses et cuillères (avec la densité de la farine, du sucre, du beurre…), et des prix à la livre aux prix au kilo.</li></ul>`)
  + D("Partager l'application", `<p>Pour l'installer sur un autre téléphone, ouvre ce lien dans Safari ou montre ce code à scanner avec l'appareil photo :</p>
    <p><a href="https://mdulac86.github.io/Menu/">mdulac86.github.io/Menu</a></p><p><img src="qr-menu.png" width="160" height="160" alt="Code QR vers l'application"></p>
    <p class="small">Chaque personne a ses propres données : rien n'est partagé entre les téléphones.</p>`)
  + D('Vie privée', `<ul><li>Tes données (famille, menus, liste, prix) restent <b>sur ton téléphone</b>. Aucun compte, aucune collecte.</li>
    <li>La seule information envoyée est ton <b>code postal</b>, à Flipp, pour trouver les circulaires de ta région.</li>
    <li>Les liens vers les sites des épiceries ouvrent leur page de recherche dans Safari.</li></ul>`)
  + (self.APP_CONTACT ? D('Signaler un problème ou une idée', `<p><a class="btn s p" href="mailto:${esc(self.APP_CONTACT)}?subject=${encodeURIComponent('Menu de la semaine ' + APPV)}&body=${encodeURIComponent('Appareil : ' + navigator.userAgent + '\n\n')}">Écrire un courriel</a></p><p class="small">La version de l'application et le modèle du téléphone sont ajoutés; aucune de tes données.</p>`) : '')
  + D('16. Questions fréquentes', `<p><b>Le menu ne change pas quand je le refais.</b> Les plats « Gardé » restent; une fois l'épicerie terminée, le menu est verrouillé jusqu'à « Terminer la semaine ».</p>
    <p><b>Un article est en double.</b> Deux recettes le nomment différemment; additionne-les en magasin.</p>
    <p><b>Les quantités ne conviennent pas.</b> Ajuste les portions (Profil ou repas par repas), les quantités d'accompagnements, ou modifie la recette. Les quantités des recettes sont des estimations : corrige celles qui ne conviennent pas à ta famille.</p>
    <p><b>Un spécial ne correspond pas à l'article</b> (ex. des oeufs Kinder pour des oeufs). Onglet Articles → l'article → « Pas ce produit » : il ne sera plus jamais associé. Les friandises, plats préparés et produits « à la » ou « aux » (nouilles aux oeufs, poulet au beurre) sont déjà écartés automatiquement.</p>
    <p><b>Tout recommencer.</b> Profil → « Tout remettre à zéro ».</p>`);
}


/* ---------- démarrage ---------- */
/* un brouillon de recette réellement commencé (pas seulement un formulaire vide ouvert) */
const draftsDirty = () => { try{ return Object.values(drafts).some(d => d && ((typeof d.n==='string' && d.n.trim()) || (typeof d.s==='string' && d.s.trim()) || (Array.isArray(d.rows) && d.rows.some(r => r && typeof r.n==='string' && r.n.trim())))); }catch(e){ return false; } };
const missingFiles = () => [typeof RECIPES==='undefined' && 'recettes.js', typeof BAREME==='undefined' && 'prix-maxi.js'].filter(Boolean);
(function init(){
  try{ if('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', {updateViaCache: 'none'}).then(reg => { document.addEventListener('visibilitychange', () => { if(document.visibilityState==='visible') reg.update().catch(()=>{}); }); }).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if(draftsDirty()){ setSync('Nouvelle version prête : elle s\'appliquera à la prochaine ouverture.'); return; } if(had && !sessionStorage.getItem(PFX+'maj')){ try{ sessionStorage.setItem(PFX+'maj', '1'); }catch(e){} location.reload(); } });
  } }catch(e){}
  loadLocal();
  migrer();
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{}); }catch(e){}
  try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); }catch(e){}
  try{ render(); }
  catch(err){
    /* un fichier de l'application n'a pas été chargé (connexion) : ce ne sont pas les données, on ne touche à rien */
    if(missingFiles().length){ setSync("Un fichier de l'application n'a pas pu être chargé (" + missingFiles().join(', ') + "). Vérifie la connexion et recharge la page. Tes données sont intactes."); return; }
    /* données qui empêchent l'affichage : on les met de côté et on n'enregistre plus rien par-dessus */
    try{ const j = localStorage.getItem(KEY); if(j && !localStorage.getItem(RESCUE)) localStorage.setItem(RESCUE, j); }catch(_){}
    loadFailed = true; rescued = false; S = DEFAULT(); S.appv = APPV;
    S.flash = "Tes données ont causé une erreur d'affichage. Elles sont gardées telles quelles, rien n'est effacé ni remplacé : Profil → Sauvegarde → « Essayer de les restaurer », ou « Tout remettre à zéro » pour repartir.";
    try{ render(); }catch(_){}
  }
  setSync(loadFailed ? 'Mode secours : tes données sont gardées de côté' : 'Enregistré sur cet appareil');
  /* dernière protection : une erreur imprévue s'affiche au lieu de bloquer l'application en silence */
  window.addEventListener('error', e => { setSync('Petit problème : ' + (e.message || 'erreur') + '. Tes données sont intactes.'); });
  window.addEventListener('unhandledrejection', e => { setSync('Petit problème : ' + ((e.reason && e.reason.message) || 'erreur') + '. Tes données sont intactes.'); });
})();
