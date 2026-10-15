/* Menu de la semaine — Écrans : menu, épicerie, maison, recettes, articles, prix.
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
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
/* « 3 autres choix » : des plats semblables (même sorte, temps proche), pas déjà au menu ni faits récemment, avec l'écart de coût */
let altKey = '';
function altsFor(it, l){
  const r = byName(it.r); if(!r) return [];
  const kind = kindOf(r), used = new Set(allItems().map(x => x.r)), recent = recentSet(), c0 = dishCost(it), t0 = tpOf(r), lg = isLong(r);
  return allRecipes().filter(x => kindOf(x)===kind && !used.has(x.n) && !S.dis[x.n] && !softBad(x) && ppOk(x) && simpleOk(x) && !recent.has(x.n) && (lg || !isLong(x)) && Math.abs(tpOf(x) - t0) <= 20)
    .map(x => ({x, s: score(x) + (protein(x)===protein(r) ? .3 : 0)})).sort((a, b) => b.s - a.s).slice(0, 3)
    .map(({x}) => { const ni = (l==='items' || l==='din') ? mkItem(x, new Set(), pickVar(x)) : {r:x.n, v:0}; if(it.pt) ni.pt = it.pt; return {x, dc: dishCost(ni) - c0, why: whyOf(ni)}; });
}
function altsHtml(it, i, l){
  const A = altsFor(it, l); if(!A.length) return '<p class="small">Aucun autre plat semblable pour l\'instant.</p>';
  return `<div class="list alts">${A.map(o => `<div class="item"><span class="t"><b>${esc(o.x.n)}</b><small>${esc(tmShort(o.x))} · ${o.dc >= 0 ? '+' : '−'}${money(Math.abs(o.dc))}${o.why.length ? ' · ' + esc(o.why.slice(0, 2).join(' · ')) : ''}</small></span><button class="btn s p" data-a="mpick" data-ml="${l}" data-i="${i}" data-r="${esc(o.x.n)}">Choisir</button></div>`).join('')}</div>`;
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
    ${souper ? (w => w.length ? `<p class="why"><b>Pourquoi ce plat :</b> ${esc(w.join(' · '))}</p>` : '')(whyOf(it)) : ''}
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
    ${altKey===l+'|'+i ? altsHtml(it, i, l) : ''}<div class="acts">${B('mlock', it.lock?'Gardé ✓':'Garder', it.lock?'p':'')}${B('malts', altKey===l+'|'+i ? 'Fermer les choix' : '3 autres choix')}${B('mswap','Au hasard')}
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
  if(!S.setup){ el.innerHTML = `<div class="card call"><h3>Bienvenue</h3><p class="small">Commence par décrire ta famille et ton horaire : ça prend une minute.</p><div class="acts"><button class="btn p" data-a="view" data-v="semaine">Commencer</button></div></div>`; return; }
  else if(!S.help) h += `<div class="card call"><h3>Première fois ?</h3><p class="small">L'aide explique comment installer l'application sur l'iPhone, préparer la première semaine et copier la liste.</p><div class="acts"><button class="btn s p" id="help_open">Lire l'aide</button><button class="btn s" id="help_hide">Plus tard</button></div></div>`;
  h += `<p class="note" id="flash" ${S.flash ? '' : 'hidden'}>${esc(S.flash||'')}</p>`; S.flash = '';
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
    h += `<div class="card"><h3>La semaine en un coup d'œil</h3>${weekStrip()}<div class="acts"><button class="btn s" id="frigo">Menu pour le frigo (image)</button></div></div>`;
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
/* ordre des rayons : celui choisi dans Profil → Épiceries (le parcours du magasin ou de l'appli), sinon l'ordre de base */
const rayOrder = () => { const o = (isObj(S.profil) && Array.isArray(S.profil.rayons)) ? S.profil.rayons.filter(r => RAYONS.includes(r)) : []; return o.concat(RAYONS.filter(r => !o.includes(r))); };
/* recherche du produit sur le site de l'épicerie, pour remplir le panier en ligne */
const SHOP_URL = {Maxi:'https://www.maxi.ca/fr/search?search-bar=', Provigo:'https://www.provigo.ca/fr/search?search-bar=', IGA:'https://www.iga.net/fr/search?k=', Metro:'https://www.metro.ca/epicerie-en-ligne/recherche?filter=', Walmart:'https://www.walmart.ca/fr/search?q=', Costco:'https://www.costco.ca/CatalogSearch?keyword='};
const shopLink = (r, store) => { const u = SHOP_URL[store]; if(!u) return ''; const q = plain(r.name).replace(/\s+\b(pour|de la|du|des)\b.*$/i, '');
  return `<a class="shopl" href="${u}${encodeURIComponent(q)}" target="_blank" rel="noopener">Chercher chez ${esc(store)} ↗</a>`; };
function groupsOf(rows){
  const byRay = list => rayOrder().map(ray => ({ray, rows:list.filter(r => r.rayon===ray).sort((a,b) => a.name.localeCompare(b.name,'fr'))})).filter(g => g.rows.length);
  if(S.p.grp==='magasin'){
    const ms = mainStore(), stores = [...new Set(rows.map(storeOf))].sort((a,b) => a===ms ? -1 : b===ms ? 1 : a.localeCompare(b,'fr'));
    return stores.map(s => ({title:s, sub:byRay(rows.filter(r => storeOf(r)===s))}));
  }
  return byRay(rows).map(g => ({title:cap(g.ray), sub:[{ray:'', rows:g.rows}]}));
}
function rowHtml(r, m){
  const d = dealFor(r.name), pk = packInfo(r), hl = !d && !storeMode ? histLine(r.name) : '';
  return `<label class="item ${m.chk[r.k]?'done':''}"><input type="checkbox" data-a="chk" data-k="${esc(r.k)}" ${m.chk[r.k]?'checked':''}>
    <span class="t"><b>${esc(cap(r.name))}</b>${S.p.cmd && !storeMode ? shopLink(r, S.p.grp==='magasin' ? storeOf(r) : mainStore()) : ''}${d?`<span class="tags">${tagHtml(d)}${storeMode ? '' : `<a href="#" class="fixl" data-a="ar_go" data-b="${esc(artB(r.name))}">Pas le bon ?</a>`}</span>`:''}${pk?`<small>${esc(pk)}</small>`:''}${hl?`<small class="hist">${esc(hl)}</small>`:''}${!storeMode && r.st>0?`<small>Il en faut ${fq(r.q,r.u)}, il y en a déjà ${fq(r.st,r.u)} à la maison</small>`:''}${!storeMode && r.src.length?`<small>${esc(r.src.slice(0,3).join(', '))}${r.src.length>3?'…':''}</small>`:''}${cmpLine(r)}</span>
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
  const cf = calF(), calTxt = Math.abs(cf - 1) >= .02 ? `<p class="small">Estimation corrigée de ${cf > 1 ? '+' : '−'}${Math.round(Math.abs(cf - 1) * 100)} % d'après tes dernières factures.</p>` : '';
  const fit = b && rest < 0 && S.menu.date && !S.menu.achete ? `<div class="acts"><button class="btn s" id="bfit">Remplacer des soupers par des plats moins chers</button></div>` : '';
  return `<div class="budget"><p><span class="small">Total estimé</span> <b>≈ ${money(t.cost)}</b>${t.save >= 1 ? `<span class="small"> · ≈ ${money(t.save)} économisés en spéciaux</span>` : ''}</p>
    ${b ? `<div class="bar ${rest<0?'over':''}"><i style="width:${Math.min(100, t.cost/b*100)}%"></i></div><p class="small">Budget ${money(b)} : ${rest >= 0 ? `il reste ≈ <b>${money(rest)}</b>` : `<b class="over">dépasse de ≈ ${money(-rest)}</b>`}</p>` : ''}
    ${calTxt}${fit}${prixVieux() ? `<p class="small over">Les prix de référence datent de plus de 4 mois (${esc(PRIX_MAJ_TXT())}) : le total est probablement sous-estimé. <a href="#" data-a="pm_go">Les mettre à jour</a></p>` : ''}<p class="small">Prix réguliers du barème Maxi (${esc(PRIX_MAJ_TXT())}) pour les formats à acheter (le reste du format va dans Maison), remplacés par les spéciaux et par tes prix : touche un prix pour le corriger.</p></div>`;
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
    <div class="seg" role="group" aria-label="Façon de faire l'épicerie"><button class="${S.p.cmd?'on':''}" data-a="cmdmode" data-v="1">Commande en ligne</button><button class="${!S.p.cmd?'on':''}" data-a="cmdmode" data-v="0">En magasin</button></div>
    ${S.p.cmd ? `<p class="small">Chaque article a un lien vers le site de l'épicerie : ouvre-le, ajoute au panier, reviens et coche. Le format à commander est indiqué sous le nom.</p>` : `<button class="btn p" id="store_on">Mode magasin</button>`}</div>`;
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
  return `<div class="ibw${x.doute ? ' doute' : ''}">${x.doute ? `<small class="dt">À vérifier : ${esc(x.doute)}</small>` : ''}<div class="ibr"><input type="text" class="ib_n" ${a} value="${esc(x.n||'')}" placeholder="Aliment : tape quelques lettres" aria-label="Aliment ${j+1}" autocomplete="off">
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
    if(rf.mij && !mjOf(r)) return false;
    if(rf.aime && !(S.fav[r.n] || ((S.rate[r.n]||{}).up||0) > ((S.rate[r.n]||{}).down||0))) return false;
    if(rf.spec && !dealsOf(r).length) return false;
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
    <div class="chips">${chk('fast','Préparation 30 min ou moins')}${chk('mij','Mijoteuse')}${chk('spec','En spécial cette semaine')}${chk('aime','Aimés de la famille')}${chk('fav','Favoris')}${chk('dis',"Mis de côté")}</div>
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
/* ---------- mise à jour des prix ----------
   Le site de Maxi ne peut pas être lu par l'application (il le bloque). On liste donc les articles qui comptent,
   avec un lien vers maxi.ca et le prix régulier vu dans les circulaires; on inscrit le prix du format, c'est tout. */
function prixArts(){
  const w = new Map(), add = (n, x) => { const b = baremeRaw(n); if(!b) return; const k = bxKey(b), o = w.get(k) || {b, n:plain(n), w:0}; o.w += x; w.set(k, o); };
  if(S.menu.date){ try{ buyList().rows.forEach(r => add(r.name, 20)); }catch(e){} }
  (S.ess||[]).concat(S.snacks||[]).forEach(o => add(o.name, 8));
  allRecipes().forEach(r => r.i.forEach(g => add(g[2], 1)));
  const q = norm(artF.q||'').trim();
  let L = [...w.values()].sort((a, c) => c.w - a.w);
  if(q) L = L.filter(o => norm(o.n).includes(q)); else L = L.slice(0, 40);
  return L;
}
function prixRow(o){
  const b = mergeBx(o.b), raw = o.b[1], ov = (S.bx||{})[bxKey(o.b)] || {}, k = esc(bxKey(o.b)), n = esc(o.n);
  const unitTxt = s => raw.u==='un' ? (s===1 ? "l'unité" : 'paquet de '+s) : fq(s, raw.u);
  const inp = (val, ph, extra) => `<input type="text" inputmode="decimal" class="num pm_in" data-k="${k}" ${extra} value="${val ? String(val).replace('.', ',') : ''}" placeholder="${String(ph).replace('.', ',')}" aria-label="Nouveau prix">`;
  const fields = raw.kg ? `<label class="f">Prix au kilo ($/kg)${inp(ov.kg, b[1].kg, 'data-kg="1"')}</label>`
    : raw.f.map(([s], i) => `<label class="f">${esc(cap(unitTxt(s)))} ($)${inp(ov.f && ov.f[i], b[1].f[i][1], `data-i="${i}"`)}</label>`).join('');
  const H = ((S.ph||{})[artB(o.n)] || []).filter(e => e.r).slice(0, 2);
  const vu = H.length ? `<small>Prix régulier vu dans les circulaires : ${H.map(e => `${esc(money(e.r))} chez ${esc(e.s)} (${esc(e.t)}, ${esc(dShort(e.d))})`).join(' · ')}</small>` : '';
  const quand = ov.d ? `<small class="ok">Mis à jour le ${esc(dShort(ov.d))}</small>` : '';
  return `<div class="item" style="display:block"><span class="t"><b>${esc(cap(o.n))}</b>${quand}${vu}</span>
    <div class="grid2" style="margin-top:6px">${fields}</div>
    <p class="small"><a href="https://www.maxi.ca/fr/search?search-bar=${encodeURIComponent(o.n)}" target="_blank" rel="noopener">Voir le prix sur maxi.ca ↗</a>${Object.keys(ov).some(x => x!=='d') ? ` · <a href="#" data-a="pm_reset" data-k="${k}">Revenir au prix du fichier</a>` : ''}</p></div>`;
}
function prixView(){
  const L = prixArts(), p = pmaj();
  return `<div class="card"><h3>Mise à jour des prix</h3>
    <p class="small">Prix réguliers (pas les spéciaux) des articles qui comptent le plus dans ton épicerie, ${esc(PRIX_MAJ_TXT())}. Touche « Voir le prix sur maxi.ca », puis inscris le prix du même format. Un champ vide garde le prix actuel (en gris).</p>
    <label class="f">Ajuster tous les autres prix de (%)<input type="text" inputmode="decimal" class="num" id="pm_pct" value="${p.pct ? String(p.pct).replace('.', ',') : ''}" placeholder="0 (ex. 3 pour +3 %)"></label>
    <p class="small">Pratique pour suivre l'inflation sur tout ce que tu ne vérifies pas un par un.</p>
    <div class="acts"><button class="btn s p" data-a="pm_done">J'ai terminé la mise à jour</button></div>
    <p class="note" id="pm_msg" hidden></p></div>
    ${L.length ? `<div class="card list">${L.map(prixRow).join('')}</div>` : `<div class="empty"><b>Aucun article</b><span>Rien ne correspond à cette recherche.</span></div>`}
    ${!artF.q ? '<p class="small">Seuls les 40 articles les plus importants sont affichés : cherche un article plus haut pour en voir un autre.</p>' : ''}`;
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
