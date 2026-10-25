/* © 2026 mdulac86. Tous droits réservés. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=new Map(),element={addEventListener(){},classList:{add(){},remove(){},toggle(){}},style:{},dataset:{},textContent:'',innerHTML:'',querySelector(){return null},querySelectorAll(){return []}};
const context={console,URL,TextEncoder,TextDecoder,Blob,Response,Request,AbortController,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},crypto:require('node:crypto').webcrypto,location:{pathname:'/Menu/',protocol:'https:',href:'https://example.test/Menu/'},navigator:{userAgent:'test',language:'fr-CA'},document:{addEventListener(){},querySelector(){return {...element}},querySelectorAll(){return []},documentElement:element,body:element,createElement(){return {...element}}},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},sessionStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:false,addEventListener(){}}),history:{replaceState(){},pushState(){}},addEventListener(){}};
context.self=context;context.window=context;vm.createContext(context);
for(const f of ['version.js','recettes.js','prix-maxi.js','photos.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8').split('(function init(){')[0],context,{filename:'app.js'});
const run=s=>vm.runInContext(s,context);let count=0;
function check(name,fn){fn();count++;console.log('✓ '+name)}
check('407 recettes et identifiants uniques',()=>{assert.equal(run('RECIPES.length'),407);assert.equal(run('new Set(RECIPES.map(r=>r.n)).size'),407)});
check('index recettes actualisé après ajout et modification',()=>{run("FAMREC=[];S=DEFAULT();resetCaches();this.before=byName(RECIPES[0].n);S.redit[RECIPES[0].n]={tm:123};resetCaches()");assert.equal(run('byName(RECIPES[0].n).tm'),123);assert.equal(run("byName('recette absente')"),undefined)});
check('quantités françaises',()=>{assert.equal(run("numIn('1 200,5 $')"),1200.5);assert.equal(run("numIn('-20')"),0);assert.equal(run("fq(1500,'g')"),'1,5 kg')});
check('migration conserve menus, favoris, stock et recettes personnelles',()=>{run("S=DEFAULT();S.setup=true;S.menu.items=[{r:RECIPES[0].n,v:1,pt:4,lock:true}];S.fav[RECIPES[0].n]=true;S.stock.x={name:'Riz',q:500,u:'g'};S.custom=[{n:'Mon repas',i:[[200,'g','Riz','épicerie']],s:'Cuire',m:[]}];this.original=JSON.stringify(S);S=mergeState(JSON.parse(original));migrer()");assert.equal(run('S.menu.items[0].pt'),4);assert.equal(run('S.menu.items[0].v'),1);assert.equal(run('S.fav[RECIPES[0].n]'),true);assert.equal(run('S.custom[0].n'),'Mon repas');assert.equal(run('Object.values(S.stock)[0].q'),500)});
check('copie avant mise à jour et secrets hors état',()=>{data.clear();run("localStorage.setItem(KEY,original);loadLocal()");assert.equal(run('readCopies()[0].label'),'Avant la mise à jour');assert.equal(run('S.appv'),'2.3.9');assert.equal(run("'gemini' in S"),false)});
check('copie quotidienne, rotation de cinq copies',()=>{run("save();for(let i=0;i<8;i++)snapshot('Test '+i,JSON.stringify(S))");assert.equal(run('readCopies().length'),5);assert.equal(run('JSON.parse(readCopies()[0].data).custom[0].n'),'Mon repas')});
check('copies corrompues récupérables',()=>{data.set('menu_epicerie_copies','{}');assert.equal(run('readCopies().length'),0);run("snapshot('Réparation',original)");assert.equal(run('readCopies().length'),1)});
check('données illisibles mises en secours',()=>{data.clear();run("localStorage.setItem(KEY,'{cassé');loadFailed=false;rescued=false;loadLocal()");assert.equal(data.get('menu_epicerie_secours'),'{cassé');run('save()');assert.equal(data.get('menu_epicerie_v1'),'{cassé')});
check('types invalides corrigés sans perdre les données valides',()=>{assert.equal(run("mergeState({menu:{items:'incorrect'},stock:{},custom:[],p:{budget:-12}}).p.budget"),0);assert.equal(run("Array.isArray(mergeState({menu:{items:'incorrect'}}).menu.items)"),true)});
check('portions selon âge et appétit',()=>{assert.equal(run("portionDe({a:'adulte',ap:'normal'})"),1);assert.equal(run("portionDe({a:'enfant',age:14,ap:'grand'})"),1.375)});
check('génération cohérente et liste quantifiée',()=>{data.clear();run("S=DEFAULT();S.setup=true;S.help=true;S.profil=PROFIL0();S.profil.verifier=false;FAMREC=[];loadFailed=false;rescued=false;render=()=>{};resetCaches();genMenu()");assert.ok(run('S.menu.items.length')>0);assert.equal(run('new Set(S.menu.items.map(x=>x.r)).size'),run('S.menu.items.length'));assert.ok(run('buyList().rows.every(x=>Number.isFinite(x.q)&&x.q>=0)'));assert.ok(run('Number.isFinite(listTotals(buyList().rows).cost)'))});
check('restauration valide et refus copie invalide',()=>{run("this.good=JSON.stringify(S);restoreFrom(good,'Test')");assert.ok(run('readCopies().some(x=>x.label===\'Avant la restauration\')'));assert.throws(()=>run("restoreFrom('{\"menu\":null}', 'Invalide')"));assert.ok(run('S.menu.items.length')>0)});
check('spéciaux : produits de base et faux amis',()=>{
  assert.equal(run("matchesFor('oeufs',[{t:'Nouilles aux oeufs',p:'2,99 $',s:'IGA'}]).length"),0);
  assert.equal(run("matchesFor('oeufs',[{t:'Kinder Surprise',p:'2,99 $',s:'IGA'}]).length"),0);
  assert.ok(run("prixBase('boeuf haché','g','viandes')")>0);
});
check('407 fiches et modes Cuisiner sans erreur',()=>{
  run("S=DEFAULT();FAMREC=[];resetCaches();for(const r of RECIPES){if(!recBody(r,0).includes(esc(r.i[0]?.[2]||'')))throw Error('Fiche '+r.n);cook={r:r.n,v:0,pt:4,key:'test|'+r.n};if(!cookHtml().includes(esc(r.n)))throw Error('Cuisiner '+r.n);}cook=null;");
});
check('Aujourd’hui : repas illustré et image prioritaire',()=>{
  run("S=DEFAULT();S.p.nDin=0;S.p.nDej=0;S.menu.date=isoToday();S.menu.start=isoToday();S.menu.shop=isoToday();S.menu.items=[{r:RECIPES[0].n,d:isoToday(),v:0,pt:4}];resetCaches();this.todayHtml=renderToday();");
  assert.ok(run("todayHtml.includes('today-photo')"));assert.ok(run('todayHtml.includes(esc(RECIPES[0].n))'));assert.ok(run("todayHtml.includes('fetchpriority=\"high\"')"));
});
check('30 semaines variées : budget, stock, exclusions et portions',()=>{
  for(let j=0;j<30;j++){
    run(`S=DEFAULT();S.setup=true;S.help=true;S.profil=PROFIL0();S.profil.verifier=false;S.p.n=${3+j%5};S.p.budget=${j%3 ? 0 : 180};S.p.nDej=${j%3};S.p.nDes=${j%2};S.dis[RECIPES[0].n]=true;S.stock.riz={name:'Riz',q:300,u:'g'};resetCaches();genMenu()`);
    assert.ok(run('S.menu.items.length')>0);assert.equal(run('S.menu.items.some(x=>x.r===RECIPES[0].n)'),false);assert.ok(run('buyList().rows.every(x=>Number.isFinite(x.q)&&x.q>=0)'));assert.ok(run('Number.isFinite(listTotals(buyList().rows).cost)'));
  }
});

check('familles : chaque recette reste accessible une seule fois',()=>{
 run('S=DEFAULT();FAMREC=[];resetCaches();this.entries=recipeFamilyEntries(allRecipes());');
 assert.equal(run('entries.length'),346);
 assert.equal(run('entries.flatMap(e=>e.members).length'),407);
 assert.equal(run('new Set(entries.flatMap(e=>e.members).map(r=>r.n)).size'),407);
 run('S.fav[RECIPES[51].n]=true;S.menu.items=[{r:RECIPES[51].n,v:1,pt:3}];recipeFamilyEntries(allRecipes());');
 assert.equal(run('S.fav[RECIPES[51].n]'),true);assert.equal(run('S.menu.items[0].v'),1);
 run('this.filtered=recipeFamilyEntries(allRecipes().filter(r=>r.n===RECIPES[135].n));');
 assert.equal(run('filtered.length'),1);assert.equal(run('filtered[0].members[0].n'),run('RECIPES[135].n'));
});
check('partage : variantes préservées, préférences exclues',()=>{
 run("S=DEFAULT();FAMREC=[];resetCaches();S.fav.secret=true;S.profil=PROFIL0();S.profil.membres[0].nom='Privé';this.shared=famObj(RECIPES[135]);this.received=famSan(shared);");
 assert.equal(run('received.v.length'),run('RECIPES[135].v.length'));
 assert.equal(run("received.v[1][3]"),'replace');
 for(const key of ['profil','fav','dis','stock','menu','rate','redit','vared','p'])assert.equal(run(`'${key}' in shared`),false);
});
check('préparation complète : aucune ancienne étape contradictoire',()=>{
 run("S=DEFAULT();FAMREC=[];resetCaches();cook={r:RECIPES[394].n,v:1,pt:6,key:'four'};this.html=cookHtml();");
 assert.equal(run("html.includes('325 °F')"),false);
 assert.equal(run("html.includes('frites surgelées au four')"),true);
 assert.ok(run("texteRecette({r:RECIPES[394].n,v:1,pt:6,sf:'',sv:''},0).includes('frites surgelées au four')"));
 run("this.key='va|'+RECIPES[394].n+'|b|0';varEditor(RECIPES[394],varRows(RECIPES[394])[0]);this.restored=varFromDraft(key).val;");
 assert.equal(run('restored[3]'),'replace');
});
check('641 variantes : quantités finies et non négatives',()=>{
 run("S=DEFAULT();FAMREC=[];resetCaches();for(const r of RECIPES){for(let i=0;i<=vars(r).length;i++){if(!effective(r,i).every(g=>Number.isFinite(g.q)&&g.q>=0))throw Error(r.n+' variante '+i)}}");
});

check('39 accompagnements illustrés avec préparation lisible',()=>{run("S=DEFAULT();FAMREC=[];resetCaches();rf.k='acc';rf.q='';this.sidesHtml=sidesSection()");assert.equal(run('Object.keys(SIDE_PHOTOS).length'),39);assert.ok(run("sidesHtml.includes('side-patates_pilees.webp')"));assert.ok(run("sidesHtml.includes(esc(SIDES[2].s))"));});
console.log(`${count} vérifications réussies.`);
