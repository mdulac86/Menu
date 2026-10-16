/* Menu de la semaine — Profil de la famille, assistant de départ, réglages, Ma semaine.
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
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
    <p class="small">Les prix réguliers viennent de maxi.ca (${esc(PRIX_MAJ_TXT())}${+pmaj().pct ? `, ajustés de ${esc(String(pmaj().pct).replace('.', ','))} %` : ''}). Ils servent quand un article n'est pas en spécial.${prixVieux() ? ' <b class="over">Ce relevé date de plus de 4 mois : les prix ont probablement monté.</b>' : ''}</p>
    <p class="small">Ils se corrigent tout seuls avec tes données :</p>
    <ul class="todo small">
      <li><b>Prix payé</b> : dans Épicerie, touche le prix d'un article pour inscrire ce que tu as payé. Ce prix remplace celui de Maxi pour cet article. ${nPerso ? `(${nPerso} prix à toi)` : ''}</li>
      <li><b>Prix habituel</b> : dans Articles, inscris le prix régulier d'un article.</li>
      <li><b>Circulaires</b> : à chaque recherche, les spéciaux vus sont notés avec le prix habituel quand la circulaire indique le rabais. ${nVus ? `(${nVus} articles suivis)` : ''}</li>
    </ul>
    <div class="acts"><button class="btn s p" data-a="pm_go">Mettre à jour les prix</button></div>
    <label class="check"><input type="checkbox" id="pm_rappel" ${pmaj().rappel !== false ? 'checked' : ''}> Me le rappeler chaque mois</label></div>`;
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
/* passage des données d'une version précédente à la 2.0 (au chargement et à chaque restauration) */
function migrer(){
  const m = S.menu, dow = iso => new Date(iso+'T12:00:00').getDay();
  /* un menu créé par l'ancienne version garde ses jours et sa date d'épicerie */
  if(m.date && !m.start) m.start = S.dates.shop || isoToday();
  if(m.date && !m.shop) m.shop = S.dates.shop || m.start;
  /* profil créé d'après les portions actuelles (sans les changer), à vérifier par l'utilisateur */
  if(S.setup && !isObj(S.profil)){
    const n = Math.max(1, Math.round(+S.p.souper || 4)), a = Math.min(2, n), ram = S.dates.shop ? dow(S.dates.shop) : m.shop ? dow(m.shop) : 6;
    S.profil = Object.assign(PROFIL0(), {membres: Array.from({length:n}, (_, i) => i < a ? {a:'adulte', ap:'normal', l:(S.p.restes||0) > i} : {a:'enfant', age:14, ap:'normal', l:(S.p.restes||0) > i}),
      jours:{plan:(ram + 5) % 7, cmd:(ram + 6) % 7, ram, cuis: m.start ? dow(m.start) : ram}, princ:S.p.main || S.stores[0] || '', verifier:true});
  }
}
function restoreFrom(raw, label){
  const o = JSON.parse(raw); if(!isObj(o) || !isObj(o.menu) || !isObj(o.stock)) throw new Error('invalide');
  const m = mergeState(o);   /* vérifie et complète AVANT de toucher aux données actuelles */
  if(!loadFailed && !snapshot('Avant la restauration', JSON.stringify(S))){ const e = $('#bk_msg'); if(e) e.textContent = "Espace plein : enregistre d'abord une sauvegarde dans Fichiers, puis réessaie."; throw Object.assign(new Error('espace'), {shown:true}); }
  const prev = S; S = m; S.appv = APPV; migrer();
  try{ render(); }catch(e){ S = prev; try{ save(); render(); }catch(_){} throw e; }   /* copie qui ne s'affiche pas : on revient aux données d'avant */
  loadFailed = false; save(); render();
  S.flash = label; const bm = $('#bk_msg'); if(bm) bm.textContent = label;
}
/* ---------- profil de la famille ----------
   Le profil décrit la famille, son horaire et ses épiceries. Il est gardé sur le téléphone (S.profil)
   et sert à calculer les portions, les lunchs, la semaine du menu et la date des spéciaux. */
const DOW = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const APPETITS = [['petit','Petit appétit',.8],['normal','Appétit normal',1],['grand','Grand appétit',1.25]];
const PROFIL0 = () => ({membres:[{a:'adulte', ap:'normal', l:true},{a:'adulte', ap:'normal', l:true},{a:'enfant', age:10, ap:'normal', l:true},{a:'enfant', age:8, ap:'normal', l:true}],
  jours:{plan:4, cmd:5, ram:6, cuis:0}, princOnly:true, v:1});
const profil = () => { if(!isObj(S.profil)) S.profil = PROFIL0(); const p = S.profil; if(!Array.isArray(p.membres) || !p.membres.length) p.membres = PROFIL0().membres; if(!isObj(p.jours)) p.jours = PROFIL0().jours; return p; };
/* portion d'une personne : adulte 1; enfant selon l'âge (un ado mange comme un adulte), × appétit */
function portionDe(m){
  const base = m.a==='adulte' ? 1 : (+m.age||8) <= 5 ? .5 : (+m.age||8) <= 9 ? .7 : (+m.age||8) <= 12 ? .9 : 1.1;
  return base * ((APPETITS.find(x => x[0]===m.ap) || APPETITS[1])[2]);
}
const portionsFamille = () => profil().membres.reduce((t, m) => t + portionDe(m), 0);
const portionsLunch = () => profil().membres.filter(m => m.l).reduce((t, m) => t + portionDe(m), 0);
/* applique le profil aux réglages de portions déjà utilisés partout dans l'application */
function appliquerProfil(){
  /* seulement les portions du souper et des restes pour les lunchs : les autres réglages restent ceux de l'utilisateur */
  const P = profil(), f = Math.max(1, Math.round(portionsFamille())), l = Math.round(portionsLunch());
  S.p.souper = Math.min(12, f); S.p.restes = Math.min(10, l);
  if(S.p.nDin === undefined) S.p.nDin = l ? 5 : 0;
  if(P.princ){ S.p.main = P.princ; if(!S.stores.includes(P.princ)) S.stores = [P.princ].concat(S.stores); }
}
/* prochain jour de la semaine `dow` à partir de la date iso (le jour même compte) */
const nextDow = (iso, dow) => { const d = new Date(iso+'T12:00:00').getDay(); return addDays(iso, ((dow - d) + 7) % 7); };
const nextPickup = () => nextDow(isoToday(), profil().jours.ram);
/* premier jour de cuisine après le ramassage */
const startFrom = shop => S.profil ? nextDow(shop, profil().jours.cuis) : shop;
const famLine = () => { const M = profil().membres, a = M.filter(m => m.a==='adulte').length, e = M.filter(m => m.a!=='adulte');
  return `${a} adulte${a>1?'s':''}${e.length ? `, ${e.length} enfant${e.length>1?'s':''} (${e.map(m => (+m.age||'?')+' ans').join(', ')})` : ''}`; };

function familleCard(){
  const P = profil();
  const row = (m, i) => `<div class="item" style="display:block"><div class="grid2">
      <label class="f">${m.a==='adulte' ? 'Adulte' : 'Enfant'} ${P.membres.slice(0, i+1).filter(x => (x.a==='adulte')===(m.a==='adulte')).length}<select data-pf="a" data-i="${i}"><option value="adulte" ${m.a==='adulte'?'selected':''}>Adulte</option><option value="enfant" ${m.a!=='adulte'?'selected':''}>Enfant</option></select></label>
      ${m.a!=='adulte' ? `<label class="f">Âge<input type="text" inputmode="numeric" class="num" data-pf="age" data-i="${i}" value="${esc(m.age||'')}" placeholder="ans"></label>` : '<span></span>'}
      <label class="f">Appétit<select data-pf="ap" data-i="${i}">${APPETITS.map(([v,n]) => `<option value="${v}" ${m.ap===v?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="check" style="align-self:end"><input type="checkbox" data-pf="l" data-i="${i}" ${m.l?'checked':''}> Lunch (travail ou école)</label></div>
      ${P.membres.length > 1 ? `<button class="btn s d" data-a="pf_rm" data-i="${i}">Retirer</button>` : ''}</div>`;
  return `<div class="card"><h3>La famille</h3><p class="small">Les portions sont calculées d'après la famille : ${esc(famLine())}, soit environ <b>${nfr(portionsFamille(), 1)} portions</b> au souper et <b>${nfr(portionsLunch(), 1)}</b> en lunchs (restes).</p>
    <div class="list">${P.membres.map(row).join('')}</div>
    <div class="acts"><button class="btn s" data-a="pf_add" data-v="adulte">Ajouter un adulte</button><button class="btn s" data-a="pf_add" data-v="enfant">Ajouter un enfant</button></div></div>`;
}
const dowSel = (k, label) => `<label class="f">${label}<select data-pj="${k}">${[0,1,2,3,4,5,6].map(d => `<option value="${d}" ${profil().jours[k]===d?'selected':''}>${cap(DOW[d])}</option>`).join('')}</select></label>`;
function horaireCard(){
  return `<div class="card"><h3>Horaire de la semaine</h3><p class="small">Le menu commence le premier jour de cuisine après le ramassage. Les spéciaux sont choisis pour la date du ramassage, et l'accueil propose la bonne étape chaque jour.</p>
    <div class="grid2">${dowSel('plan','Je planifie le')}${dowSel('cmd','Je commande le')}${dowSel('ram','Je ramasse le')}${dowSel('cuis','On commence à cuisiner le')}</div>
    <label class="check"><input type="checkbox" data-pfb="princOnly" ${profil().princOnly!==false?'checked':''}> Faire la liste à l'épicerie principale; m'avertir quand une autre est nettement plus avantageuse</label></div>`;
}
function rayonsCard(){
  const o = rayOrder();
  return `<div class="card"><h3>Ordre des rayons</h3><p class="small">La liste suit cet ordre. Place-les comme ton parcours dans le magasin ou dans l'appli de commande.</p>
    <div class="list">${o.map((r, j) => `<div class="item"><span class="t">${j+1}. ${esc(cap(r))}</span>${j ? `<button class="btn s" data-a="rayup" data-j="${j}" aria-label="Monter ${esc(r)}">Monter</button>` : ''}</div>`).join('')}</div></div>`;
}
function testCard(){
  if(!TEST) return '';
  let has = false; try{ has = !!localStorage.getItem(REAL_KEY); }catch(e){}
  return `<div class="card call"><h3>Version de test</h3><p class="small">Cette version garde ses données à part. Tes vraies données (version familiale) ne sont jamais modifiées.</p>
    ${has ? `<button class="btn s p" id="test_copy" data-armed="0">Copier mes vraies données dans la version de test</button>` : `<p class="small">Aucune donnée de la version familiale sur ce téléphone. Pour partir des données d'un autre téléphone : sur celui-ci, Profil → Sauvegarde → « Enregistrer une copie », puis ici « Restaurer » avec ce fichier.</p>`}
    <p class="note" id="test_msg" hidden></p></div>`;
}
/* le profil seul (sans le menu ni l'historique), à garder ou à donner à un proche */
const PROFIL_KEYS = ['profil','cp','stores','storesx','ess','snacks','maison','bx','pmaj','art'];
function profilFichierCard(){
  return `<div class="card"><h3>Mon profil</h3><p class="small">Famille, horaire, épiceries, achats réguliers et prix corrigés, sans le menu ni l'historique. Pratique pour réinstaller l'application ou la préparer pour un proche.</p>
    <div class="acts"><button class="btn s" id="pf_export">Enregistrer mon profil</button><label class="btn s" style="display:inline-flex;align-items:center">Charger un profil<input type="file" id="pf_file" accept=".json,application/json" hidden></label></div>
    <p class="note" id="pf_msg" hidden></p></div>`;
}
async function exportProfil(){
  const o = {type:'menu-profil', v:1, p:{}}; PROFIL_KEYS.forEach(k => { if(S[k] !== undefined) o.p[k] = S[k]; });
  o.p.reglages = Object.assign({}, S.p);
  const txt = JSON.stringify(o), name = 'profil-famille.json', msg = $('#pf_msg');
  const say = t => { if(msg){ msg.textContent = t; msg.hidden = false; } };
  try{ const f = new File([txt], name, {type:'application/json'}); if(navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:'Profil Menu de la semaine'}); say('Profil enregistré.'); return; } }
  catch(e){ if(e && e.name==='AbortError') return; }
  try{ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type:'application/json'})); a.download = name; document.body.appendChild(a); a.click(); a.remove(); say('Profil enregistré.'); }
  catch(e){ copier(txt, '#pf_msg'); }
}
function importProfil(txt){
  const o = JSON.parse(txt); if(!isObj(o) || o.type!=='menu-profil' || !isObj(o.p)) throw new Error('format');
  if(!snapshot('Avant le chargement d\'un profil', JSON.stringify(S))) throw new Error('espace');
  const keep = {}; PROFIL_KEYS.forEach(k => { if(o.p[k] !== undefined) keep[k] = o.p[k]; });   /* jamais le menu, l'historique ni les recettes */
  const m = mergeState(Object.assign(JSON.parse(JSON.stringify(S)), keep, {p: Object.assign({}, S.p, isObj(o.p.reglages) ? o.p.reglages : {})}));
  delete m.reglages; S = m; S.setup = true; profil(); appliquerProfil(); save(); render();
}
/* ---------- assistant de départ ---------- */
let wiz = 0, wizEss = false;
function renderWizard(){
  const steps = ['La famille','L\'horaire','Les épiceries','Les repas','Le budget'];
  const nav = `<div class="acts">${wiz > 0 ? '<button class="btn s" data-a="wiz" data-v="-1">← Retour</button>' : ''}${wiz < steps.length-1 ? '<button class="btn s p" data-a="wiz" data-v="1">Continuer →</button>' : '<button class="btn p" id="setup_done">Commencer</button>'}</div>`;
  const head = `<div class="card call"><h3>Bienvenue ! Préparons l'application pour ta famille</h3><p class="small">Étape ${wiz+1} sur ${steps.length} : <b>${steps[wiz]}</b>. Tout se change plus tard dans l'onglet Profil.</p></div>`;
  let body = '';
  if(wiz===0) body = familleCard();
  else if(wiz===1) body = horaireCard();
  else if(wiz===2) body = `<div class="card"><h3>Mes épiceries</h3><label class="f">Code postal<input type="text" data-cp="1" value="${esc(S.cp)}" autocapitalize="characters" placeholder="A1A 1A1"></label>
      <p class="small">Coche les épiceries où tu vas, ou touche le bouton pour voir celles qui ont une circulaire près de chez toi.</p>${storePicker()}
      <label class="f">Épicerie principale<select data-pf="princ"><option value="">Choisir…</option>${(S.stores.length ? S.stores : allStores()).map(s => `<option ${profil().princ===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label></div>`;
  else if(wiz===3) body = `<div class="card"><h3>Les repas à planifier</h3><div class="grid2">${countSelects()}</div>
      <label class="check"><input type="checkbox" id="su_ess" ${S.ess.length ? 'checked disabled' : wizEss ? 'checked' : ''}> Ajouter une liste de départ pour les déjeuners, lunchs, collations et boissons</label></div>`;
  else body = `<div class="card"><h3>Le budget</h3><label class="f">Budget d'épicerie par semaine ($, 0 si aucun)<input type="text" inputmode="decimal" class="num" data-p="budget" value="${S.p.budget||0}"></label>
      <p class="small">Quand le menu dépasse ce montant, les soupers les plus chers sont remplacés par des plats moins chers.</p></div>`;
  return head + body + nav;
}

function renderReglages(){
  const p = S.p;
  let h = `<!--@apparence--><div class="card"><h3>Apparence</h3><div class="seg" role="group" aria-label="Apparence">${[['auto','Automatique'],['light','Claire'],['dark','Sombre']].map(([v,n]) => `<button class="${(p.theme||'auto')===v?'on':''}" data-a="theme" data-v="${v}">${n}</button>`).join('')}</div><p class="small">Automatique suit le téléphone : la carte crème le jour, l'ardoise le soir.</p></div>
<!--@menu-->    <div class="card"><h3>Repas à planifier</h3><div class="grid2">
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
<!--@organisation-->    <div class="card"><h3>Organisation de la semaine</h3>
      <p class="small">Jours de congé : les soupers longs à préparer et le fumoir y sont placés. En semaine, seule la préparation compte : le four sans surveillance (jusqu'à 1 h 30) et la mijoteuse sont permis.</p>
      <div class="chips">${[1,2,3,4,5,6,0].map(d => `<label class="chip"><input type="checkbox" data-off="${d}" ${(p.off||[0,6]).includes(d)?'checked':''}>${cap(JOURS[d])}</label>`).join('')}</div>
      <p class="small">Déjeuners : les jours de congé, un déjeuner cuisiné; les jours de travail, un déjeuner de semaine (céréales, rôties, gruau, yogourt…). Pour en avoir tous les jours, mets 7 dans « Déjeuners par semaine ».</p>
      <label class="check"><input type="checkbox" data-pb="desSimple" ${p.desSimple?'checked':''}> Desserts : proposer aussi les simples (fruits, crème glacée, desserts du commerce). Sinon, seulement des desserts faits maison.</label>
      <label class="check"><input type="checkbox" data-pb="dinRestes" ${p.dinRestes!==false?'checked':''}> Dîners : manger d'abord les restes du souper de la veille. Les jours sans restes, un plat de la banque des soupers (différent de ceux de la semaine).</label>
      <label class="check"><input type="checkbox" data-pb="reste" ${p.reste!==false?'checked':''}> Cuisiner une fois, manger deux fois : jumeler les grosses pièces (épaule de jambon, poulet entier…) à un plat qui utilise les restes</label>
      <label class="f">Plats préparés (pizza, lasagne surgelées…)<select data-ps="pp">${[['spec','Les mettre au menu quand ils sont en spécial (1 par semaine)'],['sugg','Seulement les suggérer quand ils sont en spécial'],['all','Comme les autres plats'],['never','Jamais']].map(([v,n]) => `<option value="${v}" ${(p.pp||'spec')===v?'selected':''}>${n}</option>`).join('')}</select></label>
</div><!--@budget--><div class="card"><h3>Budget</h3>
      <label class="f">Budget d'épicerie par semaine ($, 0 si aucun)<input type="text" inputmode="decimal" class="num" data-p="budget" value="${p.budget||0}"></label>
      <p class="small">Quand le menu dépasse ce montant, les soupers les plus chers sont remplacés par des plats moins chers.</p></div>
<!--@epiceries-->    <div class="card"><h3>Mes épiceries</h3><p class="small">La recherche des spéciaux ne lit que les circulaires des épiceries cochées. Sur la carte de la semaine (Menu), « Cette semaine, je fais l'épicerie » permet de n'en garder qu'une, par exemple pour une commande en ligne.</p>
      <label class="f">Code postal<input type="text" data-cp="1" value="${esc(S.cp)}" autocapitalize="characters" placeholder="A1A 1A1"></label>
      ${storePicker()}
      <label class="f">Épicerie principale (pour la liste par magasin)<select data-ps="main"><option value="">La première cochée${S.stores[0] ? ' ('+esc(S.stores[0])+')' : ''}</option>${(S.stores.length ? S.stores : allStores()).map(s => `<option ${p.main===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label></div>
<!--@collations-->    <div class="card"><h3>Mes collations, par jour</h3><p class="small">Multipliées par le nombre de jours, ajoutées à chaque liste.</p>${listEditor('snacks',S.snacks)}
      <label class="check"><input type="checkbox" data-pb="snk" ${S.p.snk!==false?'checked':''}> Suggérer des collations en spécial (carte « Collations en spécial » du Menu)</label></div>
<!--@ess-->    <div class="card"><h3>Achats réguliers : déjeuners, lunchs, collations et boissons</h3><p class="small">Tout ce que la famille achète chaque semaine, hors souper. Quantité pour la semaine : si un article dure plus longtemps (confiture, beurre d'arachide), baisse-le à 0 ou ajuste le stock dans Maison.</p>${listEditor('ess',S.ess)}${S.ess.length?'':'<button class="btn s" id="ess_preset">Ajouter la liste suggérée</button>'}</div>
<!--@toujours-->    <div class="card"><h3>Toujours à la maison</h3><p class="small">Séparés par des virgules. Ils ne vont pas dans la liste : ils s'affichent dans « Vérifier avant de partir ».</p><textarea id="maison">${esc(S.maison)}</textarea></div>
<!--@historique-->    <div class="card"><h3>Historique</h3>${histHtml()}
    ${S.hist.length?'<button class="btn s d" id="hclr" data-armed="0">Effacer l\'historique</button>':''}</div>
<!--@prix-->    ${prixCard()}
<!--@sauvegarde-->    ${backupCard()}
<!--@version-->    <p class="small" style="text-align:center">Version de l'application : ${esc(APPV)}${TEST ? ' (version de test)' : ''}</p>
<!--@reset-->    <div class="card"><h3>Tout remettre à zéro</h3><p class="small">Efface le menu, le stock et l'historique.</p><button class="btn s d" id="reset" data-armed="0">Réinitialiser</button></div>`;
  /* la page Profil est découpée en sous-menus : chaque carte va dans sa section */
  const P = {}; h.split(/<!--@([a-z]+)-->/).forEach((x, i, a) => { if(i % 2) P[x] = a[i+1]; });
  const V = {famille:[familleCard(), P.menu], horaire:[horaireCard(), P.organisation], epiceries:[P.epiceries, rayonsCard(), P.ess, P.collations, P.toujours],
    budget:[P.budget, P.prix], _:0, sauvegarde:[testCard(), P.sauvegarde, profilFichierCard(), P.version, P.reset], apparence:[P.apparence], historique:[P.historique]};
  const el = tab==='historique' ? $('#tab-historique') : $('#tab-profil');
  el.innerHTML = (V[tab] || V.famille).filter(Boolean).join('');
}

/* ---------- Ma semaine : l'accueil ----------
   Il montre l'étape utile selon le jour (préparer, commander, ramasser, cuisiner) et ce qu'on mange ce soir. */
/* fraîcheur d'un plat : poisson et viande hachée se mangent en début de semaine, le congelé et le garde-manger à la fin */
const _PER = new WeakMap();
function perishOf(r){
  if(!r) return 0; if(_PER.has(r)) return _PER.get(r);
  let p = 0;
  (r.i||[]).forEach(([q,u,n,ray]) => { const t = norm(n); if(/surgel|congel|boite|conserve|fume|seche/.test(t)) return;
    if(ray==='poissonnerie') p = Math.max(p, 3); else if(ray==='viandes'){ p = Math.max(p, /hache/.test(t) ? 2 : /poulet|dinde/.test(t) ? 1.5 : 1); }
    else if(/laitue|epinard|roquette|fraise|framboise|bleuet|champignon|avocat|asperge|coriandre|basilic|persil|germe/.test(t)) p = Math.max(p, 1); });
  _PER.set(r, p); return p;
}
/* pourquoi ce plat : les raisons qui ont pesé dans le choix, en mots simples */
function whyOf(it){
  const r = byName(it.r); if(!r) return [];
  const out = [];
  itemDeals(it, r).slice(0, 2).forEach(d => out.push(`${d.mot} en spécial${d.hit.p ? ' à ' + d.hit.p : ''}${d.hit.s ? ' chez ' + d.hit.s : ''}`));
  const st = stockOf(it); if(st.length) out.push('utilise ' + st.slice(0, 2).map(lowFirst).join(' et ') + ' de la maison');
  if(it.after) out.push('fait avec les restes de ' + lowFirst(it.after));
  const h = S.hist; let ago = -1; for(let k = h.length - 1; k >= 0; k--){ if(histItems(h[k]).some(x => x.r===r.n)){ ago = h.length - k; break; } }
  if(ago < 0 && h.length >= 2) out.push('jamais fait encore'); else if(ago >= 4) out.push(`pas fait depuis ${ago} semaines`);
  const rt = S.rate[r.n]; if(S.fav[r.n]) out.push('un favori'); else if(rt && rt.up > (rt.down||0)) out.push('aimé de la famille');
  if(mjOf(r)===1) out.push('à la mijoteuse'); else if(tpOf(r) <= 20) out.push('rapide à préparer');
  return out.slice(0, 4);
}
/* préparation du dimanche : les tâches regroupées pour toute la semaine */
function prepTasks(){
  const L = mlist('items').filter(x => x.d).slice().sort((a, b) => a.d.localeCompare(b.d)), out = [];
  if(!L.length) return out;
  const shop = S.menu.shop || shopISO(), jour = d => DOW[new Date(d+'T12:00:00').getDay()];
  const chop = {}, rice = [];
  L.forEach(it => { const r = byName(it.r); if(!r) return;
    const per = perishOf(r), gap = gapDays(shop, it.d);
    if(per >= 2 && gap >= 4) out.push({t:`Congeler la viande ou le poisson de « ${it.r} » dès le ramassage; le sortir au frigo ${jour(addDays(it.d, -1))} soir.`, d:addDays(it.d, -1)});
    if(/marin(er|ade)/i.test(r.s||'')) out.push({t:`Préparer la marinade de « ${it.r} » la veille (${jour(addDays(it.d, -1))}).`, d:addDays(it.d, -1)});
    if(mjOf(r)===1) out.push({t:`« ${it.r} » : remplir la mijoteuse le matin de ${jour(it.d)}.`, d:it.d});
    effective(r, it.v||0).forEach(g => { const t = norm(g.name);
      const k = /oignon(?! vert)/.test(t) ? 'oignons' : /\bail\b/.test(t) ? 'gousses d\'ail' : /poivron/.test(t) ? 'poivrons' : /celeri/.test(t) ? 'branches de céleri' : /carotte/.test(t) ? 'carottes' : '';
      if(k){ (chop[k] = chop[k] || {q:0, u:g.u, days:new Set()}); chop[k].days.add(jour(it.d)); if(g.u==='un') chop[k].q += g.q; }
      if(/\briz\b/.test(t) && !/vermicelle|galette|nouille/.test(t) && gap <= 4) rice.push(jour(it.d)); }); });
  Object.entries(chop).forEach(([k, o]) => { if(o.days.size >= 2) out.push({t:`Hacher d'avance ${o.q ? Math.ceil(o.q) + ' ' : 'les '}${k} pour ${[...o.days].join(', ')} (se gardent 4 jours au frigo).`}); });
  if(new Set(rice).size >= 2) out.push({t:`Cuire le riz en une fois pour ${[...new Set(rice)].join(' et ')} (se garde 4 jours au frigo).`});
  const long = L.find(it => isLong(byName(it.r)||{}) && isOff(it.d));
  if(long && S.p.restes > 0) out.push({t:`« ${long.r} » (${jour(long.d)}) : la recette est prévue avec les restes pour les lunchs; prévoir les plats pour les emporter.`});
  return out;
}
/* étape du jour d'après l'horaire du profil */
function etape(){
  const today = isoToday(), m = S.menu, P = profil(), np = nextPickup();
  const active = m.date && m.start && today <= addDays(m.start, 6);
  const futur = m.date && m.start && m.start > today;
  if(!m.date || (!futur && (!active || gapDays(today, np) <= 3) && np > (m.shop || ''))) return 'preparer';
  if(!m.achete && today <= (m.shop || today)) return 'commander';
  if(!m.achete) return 'ramassage';
  if(m.achete && !(m.paid > 0)) return 'payer';
  return 'cuisiner';
}
function prepareCard(){
  const np = nextPickup(), start = startFrom(np), busy = S.menu.date && S.menu.start <= isoToday();
  return `<div class="card call"><h3>Préparer ma semaine</h3>
    <p class="small">Ramassage ${esc(fmtDate(np))}, menu du ${esc(dayLbl(start).toLowerCase())} au ${esc(dayLbl(addDays(start, 6)).toLowerCase())}. Un seul bouton : les spéciaux de tes épiceries, le menu varié, le budget et la liste.</p>
    ${busy ? `<p class="small">Les soupers qui restent cette semaine sont gardés jusqu'au ${esc(dayLbl(start).toLowerCase())}; la semaine en cours passe dans l'historique.</p>` : ''}
    ${goPlanSel()}
    <div class="acts"><button class="btn p" id="prep_week" data-armed="0" ${prepBusy ? 'disabled' : ''}>${prepBusy ? 'Préparation en cours…' : 'Préparer ma semaine'}</button></div>
    <p class="small" id="sp_status" aria-live="polite"></p></div>`;
}
/* où faire l'épicerie : la question posée avant de bâtir le menu (le menu suit les spéciaux de ces épiceries) */
const goPlan = () => { const v = S.p.goPlan || ''; if(v==='auto' || v==='*' || v==='main' || S.stores.includes(v)) return v; return profil().princOnly !== false && S.p.main ? 'main' : '*'; };
function goPlanSel(){
  if(S.stores.length < 2) return '';
  const v = goPlan(), main = S.p.main;
  const o = (val, txt) => `<option value="${esc(val)}" ${v===val ? 'selected' : ''}>${esc(txt)}</option>`;
  return `<label class="f">Cette semaine, l'épicerie se fait…<select data-a="goplan">${main ? o('main', `À mon épicerie principale (${main})`) : ''}${o('auto', "Où ce sera le moins cher (l'app choisit)")}${S.stores.filter(s => s !== main).map(s => o(s, `Chez ${s}`)).join('')}${o('*', 'Dans toutes mes épiceries')}</select></label>
    <p class="small">Le menu se bâtit avec les spéciaux de ${v==='auto' || v==='*' ? 'toutes tes épiceries' : `${esc(v==='main' ? main : v)} seulement`}.${v==='auto' ? " Ensuite, l'app compare le coût de la liste dans chaque épicerie et choisit la moins chère; tu verras aussi l'économie possible en allant à deux endroits ou plus." : ''}</p>`;
}
function commanderCardOu(){ try{ return ouAllerLigne(buyList().rows); }catch(e){ return ''; } }
function commanderCard(){
  const rows = buyList().rows, left = rows.filter(r => !S.menu.chk[r.k]).length, t = listTotals(rows), main = (goStores().length ? goStores() : [S.p.main || S.stores[0] || '']).filter(Boolean).join(' et ');
  return `<div class="card call"><h3>Commander l'épicerie</h3>
    <p class="small"><b>${left}</b> article${left>1?'s':''} à mettre au panier${main ? ' chez ' + esc(main) : ''}, ≈ <b>${money(t.cost)}</b>${S.p.budget ? ` pour un budget de ${money(S.p.budget)}` : ''}. Ramassage ${esc(fmtDate(S.menu.shop || shopISO()))}.</p>
    ${commanderCardOu()}
    <div class="acts"><button class="btn s p" data-a="view" data-v="epicerie">Ouvrir la liste de commande</button></div></div>`;
}
function payerCard(){
  return `<div class="card"><h3>Ramassage fait ?</h3><p class="small">Inscris le total de la facture : il sert à suivre le budget et à corriger les prix estimés.</p>${paidField(S.menu)}</div>`;
}
function ceSoirCard(){
  const today = isoToday(), L = mlist('items'), i = L.findIndex(x => x.d===today);
  const tom = L.find(x => x.d===addDays(today, 1)), tr = tom && byName(tom.r);
  if(i < 0 && !tom) return '';
  let h = `<div class="card"><h3>Ce soir</h3>`;
  if(i >= 0){ const it = L[i], r = byName(it.r); const w = whyOf(it);
    h += `<p><b>${esc(it.r)}</b></p><p class="small">${r ? esc(tmTxt(r)) : ''}${w.length ? ' · ' + esc(w.join(' · ')) : ''}</p>
      <div class="acts"><button class="btn s p" data-a="cook" data-ml="items" data-i="${i}">Cuisiner</button></div>`; }
  else h += `<p class="small">Rien de prévu au menu ce soir.</p>`;
  if(tom && tr && perishOf(tr) >= 1) h += `<p class="small">Pour demain (${esc(tom.r)}) : sortir la viande ou le poisson du congélateur ce soir, si elle y est.</p>`;
  return h + `</div>`;
}
function prepDimancheCard(){
  const today = isoToday(), m = S.menu; if(!m.date || !m.start) return '';
  if(today < addDays(m.start, -2) || today > addDays(m.start, 1)) return '';
  const T = prepTasks(); if(!T.length) return '';
  const done = m.prep || {};
  return `<div class="card"><h3>Préparation du ${esc(dayLbl(m.start).toLowerCase())}</h3><p class="small">Ce qui se fait d'avance pour toute la semaine.</p>
    <ul class="todo">${T.map((x, j) => `<li><label class="check"><input type="checkbox" data-prep="${j}" ${done[j]?'checked':''}> ${esc(x.t)}</label></li>`).join('')}</ul></div>`;
}
/* calibrage : écart moyen entre l'estimation et le total payé (au moins 3 semaines), appliqué au total estimé */
function calF(){
  const R = S.hist.slice(-8).filter(w => w.paid > 0 && w.est > 0).map(w => w.paid / w.est).sort((a, b) => a - b);
  if(R.length < 3) return 1;
  const med = R[Math.floor(R.length / 2)]; return Math.max(.8, Math.min(1.35, med));
}
/* dépenses des 12 dernières semaines : payé (plein) ou estimé (pâle), et le budget */
function depensesCard(){
  const W = S.hist.slice(-12).map(w => ({d:w.start || '', lbl:w.date, v:w.paid > 0 ? w.paid : (w.est || 0), paid:w.paid > 0})).filter(w => w.v > 0);
  if(W.length < 2) return '';
  const b = +S.p.budget || 0, max = Math.max(b, ...W.map(w => w.v)) * 1.1, H = 120, bw = Math.min(36, Math.floor(300 / W.length) - 6), x0 = 34;
  const y = v => 10 + H - v / max * H;
  const bars = W.map((w, i) => `<rect x="${x0 + i * (bw + 6)}" y="${y(w.v).toFixed(1)}" width="${bw}" height="${(10 + H - y(w.v)).toFixed(1)}" rx="3" fill="var(--accent)" fill-opacity="${w.paid ? 1 : .35}"><title>${esc(w.lbl)} : ${money(w.v)}${w.paid ? '' : ' (estimé)'}</title></rect>`).join('');
  const bl = b ? `<line x1="${x0 - 4}" x2="${x0 + W.length * (bw + 6)}" y1="${y(b).toFixed(1)}" y2="${y(b).toFixed(1)}" stroke="var(--warn)" stroke-dasharray="4 3"/><text x="${x0 + W.length * (bw + 6) + 2}" y="${(y(b) + 4).toFixed(1)}" font-size="10" fill="var(--mute)">budget</text>` : '';
  const avg = W.reduce((t, w) => t + w.v, 0) / W.length;
  return `<div class="card"><h3>Dépenses des dernières semaines</h3><p class="small">Moyenne ${money(avg)} par semaine${b ? `, budget ${money(b)}` : ''}. Barres pâles : estimation (total payé non inscrit).</p>
    <svg viewBox="0 0 ${x0 + W.length * (bw + 6) + 44} ${H + 30}" width="100%" role="img" aria-label="Dépenses par semaine"><text x="0" y="${y(max / 1.1) + 4}" font-size="10" fill="var(--mute)">${Math.round(max / 1.1)} $</text><line x1="${x0 - 4}" x2="${x0 + W.length * (bw + 6)}" y1="${10 + H}" y2="${10 + H}" stroke="var(--line)"/>${bars}${bl}</svg></div>`;
}
function renderSemaine(){
  const el = $('#tab-semaine');
  if(!S.setup){ el.innerHTML = renderWizard(); return; }
  let h = `<p class="note" id="flash" ${S.flash ? '' : 'hidden'}>${esc(S.flash||'')}</p>`; S.flash = '';
  if(S.profil && S.profil.verifier) h += `<div class="card call"><h3>Nouveau : le profil de la famille</h3><p class="small">Les portions et les lunchs se calculent maintenant d'après la famille (adultes, enfants, appétit). Vérifie qu'il te ressemble : ${esc(famLine())}, ramassage le ${esc(DOW[profil().jours.ram])}, cuisine dès le ${esc(DOW[profil().jours.cuis])}.</p><div class="acts"><button class="btn s p" data-a="view" data-v="famille">Vérifier le profil</button><button class="btn s" data-a="pf_ok">C'est bon</button></div></div>`;
  const st = etape();
  h += renderToday();
  if(st==='preparer') h += prepareCard();
  else if(st==='commander') h += commanderCard();
  else if(st==='payer') h += payerCard();
  else if(st==='ramassage') h += `<div class="card call"><h3>Ramassage fait ?</h3><p class="small">Touche « Épicerie terminée » : les articles cochés entrent dans Maison. Inscris aussi le total de la facture pour suivre le budget.</p>${paidField(S.menu)}<div class="acts"><button class="btn s p" data-a="view" data-v="epicerie">Ouvrir la liste</button></div></div>`;
  h += prepDimancheCard();
  if(prixRappel()) h += `<div class="card"><h3>Mise à jour des prix</h3><p class="small">Les prix de référence ont été ${esc(PRIX_MAJ_TXT())}. Prends quelques minutes pour vérifier les principaux sur maxi.ca : le coût de l'épicerie et le budget seront plus justes.</p><div class="acts"><button class="btn s p" data-a="pm_go">Mettre à jour les prix</button><button class="btn s" data-a="pm_snooze">Dans une semaine</button></div></div>`;
  if(S.menu.date){ const rows = buyList().rows; h += `<div class="card"><h3>La semaine du ${esc(dayLbl(weekStart()).toLowerCase())}</h3>${weekStrip()}${budgetHtml(rows)}</div>`; h += renderAubaines(); }
  h += depensesCard();
  el.innerHTML = h;
}
/* bande compacte des 7 jours : le souper de chaque jour */
function weekStrip(){
  const L = mlist('items'), today = isoToday(), PV = (S.menu.prev || []).filter(x => x.d >= today && byName(x.r));
  const pv = PV.map(it => `<div class="calday prev${it.d===today ? ' today' : ''}"><span class="cd">${esc(dayLbl(it.d))}</span><span class="cm"><b>${esc(it.r)}</b><small>semaine en cours</small></span><button class="btn s" data-a="cook" data-ml="prev" data-i="${(S.menu.prev||[]).indexOf(it)}">Cuisiner</button></div>`).join('');
  return `<div class="cal">${pv}${weekDates().map(d => { const i = L.findIndex(x => x.d===d), it = L[i], r = it && byName(it.r);
    const tags = it ? [itemDeals(it, r||{i:[],m:[]}).length ? 'spécial' : '', it.after ? 'restes' : '', r && mjOf(r)===1 ? 'mijoteuse' : ''].filter(Boolean) : [];
    return `<div class="calday${d===today ? ' today' : ''}"><span class="cd">${esc(dayLbl(d))}</span><span class="cm">${it ? `<b>${esc(it.r)}</b><small>${r ? esc(tmShort(r)) : ''}${tags.length ? ' · ' + esc(tags.join(' · ')) : ''}</small>` : '<small>—</small>'}</span>${it ? `<button class="btn s" data-a="cook" data-ml="items" data-i="${i}" aria-label="Cuisiner ${esc(it.r)}">Cuisiner</button>` : ''}</div>`; }).join('')}</div>`;
}
/* Menu pour le frigo : une image de la semaine à enregistrer dans Photos, imprimer ou envoyer */
async function menuFrigo(){
  const W = 1080, rowH = 150, days = weekDates(), L = mlist('items'), D = mlist('dej'), P = dinPlan();
  const c = document.createElement('canvas'); c.width = W; c.height = 220 + rowH * 7 + 80; const g = c.getContext('2d');
  const font = (w, s) => `${w} ${s}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  g.fillStyle = '#fbf7ef'; g.fillRect(0, 0, W, c.height);
  g.fillStyle = '#2b2118'; g.font = font(700, 64); g.fillText('Menu de la semaine', 64, 110);
  g.fillStyle = '#7a6a58'; g.font = font(400, 34); g.fillText(`Du ${dayLbl(days[0]).toLowerCase()} au ${dayLbl(days[6]).toLowerCase()}`, 64, 165);
  const fit = (t, max, size, w) => { g.font = font(w, size); let s = String(t||''); while(g.measureText(s).width > max && s.length > 3) s = s.slice(0, -2); return s === String(t||'') ? s : s.trim() + '…'; };
  days.forEach((d, k) => { const y = 220 + k * rowH, it = L.find(x => x.d===d), dj = D.find(x => x.d===d), dn = P.find(p => p.d===d);
    g.fillStyle = k % 2 ? '#f3ecdf' : '#fbf7ef'; g.fillRect(40, y, W - 80, rowH - 8);
    g.fillStyle = '#b4532a'; g.font = font(700, 34); g.fillText(cap(DOW[new Date(d+'T12:00:00').getDay()]), 64, y + 52);
    g.fillStyle = '#2b2118'; g.fillText(fit(it ? it.r : '—', W - 380, 40, 600), 330, y + 56);
    const sub = [dj ? 'Déjeuner : ' + dj.r : '', dn ? 'Lunch : ' + (dn.rest ? 'restes de ' + lowFirst(dn.rest.r) : dn.it ? dn.it.r : '') : ''].filter(Boolean).join('   ·   ');
    if(sub){ g.fillStyle = '#7a6a58'; g.fillText(fit(sub, W - 380, 28, 400), 330, y + 104); } });
  g.fillStyle = '#7a6a58'; g.font = font(400, 24); g.fillText('Fait avec Menu de la semaine', 64, c.height - 36);
  const blob = await new Promise(r => c.toBlob(r, 'image/png')); if(!blob) return;
  frigoFile = new File([blob], 'menu-semaine.png', {type:'image/png'});
  /* l'image s'affiche : appui long pour l'enregistrer dans Photos, ou « Partager » (un nouveau toucher, exigé par l'iPhone) */
  const box = $('#frigo_box'); if(box){ box.innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="Menu de la semaine" style="width:100%;border-radius:12px;margin-top:10px"><p class="small">Appuie longuement sur l'image pour l'enregistrer dans Photos, ou :</p><div class="acts"><button class="btn s p" id="frigo_share">Partager l'image</button></div>`; }
}
let frigoFile = null;
async function partagerFrigo(){
  if(!frigoFile) return;
  try{ if(navigator.canShare && navigator.canShare({files:[frigoFile]})){ await navigator.share({files:[frigoFile], title:'Menu de la semaine'}); return; } }catch(e){ if(e && e.name==='AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(frigoFile); a.download = 'menu-semaine.png'; document.body.appendChild(a); a.click(); a.remove();
}
/* « Préparer ma semaine » : spéciaux → menu → budget, en une fois */
let prepBusy = false;
async function preparerSemaine(){
  if(prepBusy) return; prepBusy = true;
  try{ await preparerSemaine0(); } catch(e){ prepBusy = false; render(); throw e; } finally { prepBusy = false; }
}
async function preparerSemaine0(){
  const say = t => { const s = $('#sp_status'); if(s) s.textContent = t; };
  const today = isoToday();
  /* les soupers qui restent cette semaine (déjà achetés) restent au menu jusqu'au début de la nouvelle */
  let prev = [];
  if(S.menu.date && S.menu.start <= today){ prev = mlist('items').filter(x => x.d && x.d >= today).map(x => Object.assign({}, x, {lock:true})); terminerSemaine(); }
  tab = 'semaine';
  if(!(S.dates.man && S.dates.shop && S.dates.shop >= today)){ S.dates.shop = nextPickup(); S.dates.man = false; }
  const gp = goPlan();
  if(S.stores.length > 1){ const one = gp==='main' ? S.p.main : S.stores.includes(gp) ? gp : '';
    S.skip = one ? S.stores.filter(s => s !== one) : []; S.goSome = false; S.goAuto = gp==='auto'; }
  save(); render();
  if(S.stores.length && S.cp && !(S.auto && S.auto.shop === S.dates.shop && S.auto.maj === isoToday())){ say('Recherche des spéciaux…'); try{ await chercherSpeciaux(false); }catch(e){} }
  const sp = (S.auto && S.auto.shop === S.dates.shop) ? autoItems().length : 0;
  genMenu();
  S.menu.prev = prev.filter(x => x.d < S.menu.start);
  /* « l'app choisit » : la liste va à l'épicerie la moins chère; les combinaisons restent proposées dans Épicerie */
  let ouTxt = '';
  if(S.goAuto && S.stores.length > 1){ resetCaches(); const C = comparer(buyList().rows), b = C.best, m = C.multi[0];
    choisirEpiceries(b.stores); S.p.grp = 'rayon'; resetCaches();
    ouTxt = ` Le moins cher cette semaine : ${b.stores[0]}.` + (m ? ` En allant aussi chez ${m.stores.filter(s => s !== b.stores[0]).join(' et ')} : ≈ ${money((b.total - m.total)*calF())} de moins (voir Épicerie).` : ''); }
  const rows = buyList().rows, t = listTotals(rows), aub = aubaines().length;
  S.flash = `Menu prêt : ${mlist('items').length} soupers du ${dayLbl(S.menu.start).toLowerCase()} au ${dayLbl(addDays(S.menu.start, 6)).toLowerCase()}, ≈ ${money(t.cost)}${S.p.budget ? ' (budget ' + money(S.p.budget) + ')' : ''}${t.save >= 1 ? ', ≈ ' + money(t.save) + ' économisés en spéciaux' : ''}.`
    + (sp ? '' : ' Les circulaires de cette semaine ne sont pas encore lues : relance « Chercher les spéciaux » jeudi pour un menu qui en profite.')
    + (aub ? ` ${aub} vraie${aub>1?'s':''} aubaine${aub>1?'s':''} à considérer pour faire des réserves.` : '') + ouTxt;
  tab = 'semaine'; prepBusy = false; save(); render(); window.scrollTo(0, 0);
}
