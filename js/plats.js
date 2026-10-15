/* Menu de la semaine — Recettes : variantes, accompagnements, portions, mode Cuisiner, textes, importation.
   Les fichiers de js/ partagent les mêmes variables globales; ils sont chargés dans l'ordre de index.html. */
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
const CK = PFX + 'cuisine';   /* cases cochées, à part des données (pas de sauvegarde pour ça) */
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
    /* à vérifier : quantité absente, unité différente de celle du catalogue (ex. riz en tasses), ou aliment inconnu */
    const doute = g.noq ? 'quantité absente' : (c && c.u !== u && !(c.u==='g' && u==='un' && gpuOf(norm(name)))) ? `d'habitude en ${c.u==='un' ? 'unités' : c.u}` : !c ? 'aliment nouveau' : '';
    return {n:name, q:String(+(+qq).toFixed(2)), u:uu, ray: c ? c.ray : g.can ? 'épicerie' : guessRayon(g.name), doute};
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
