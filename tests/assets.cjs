/* © 2026 mdulac86. Tous droits réservés. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),c={};vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(root,'recettes.js'),'utf8')+';this.recipes=RECIPES;',c);
vm.runInContext(fs.readFileSync(path.join(root,'photos.js'),'utf8')+';this.photos=RECIPE_PHOTOS;this.sidePhotos=SIDE_PHOTOS;this.sides=SIDES;',c);
assert.equal(c.recipes.length,416);assert.equal(Object.keys(c.photos).length,416);const hashes=new Set();let bytes=0;
for(const r of c.recipes){const src=c.photos[r.n];assert.ok(src,`Photo absente : ${r.n}`);assert.match(src,/^assets\/recipes\/recipe-\d{3}-[0-9a-f]{10}\.webp$/);const b=fs.readFileSync(path.join(root,src));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.ok(b.length<350000,`Image trop lourde : ${src}`);bytes+=b.length;hashes.add(crypto.createHash('sha256').update(b).digest('hex'));}
assert.equal(fs.readdirSync(path.join(root,'assets/recipes')).filter(n=>n.endsWith('.webp')).length,455,'Aucun ancien fichier image dans la livraison.');
assert.equal(hashes.size,416,'Chaque recette doit avoir une image distincte.');
assert.equal(Object.keys(c.sidePhotos).length,39);
for(const side of c.sides){const src=c.sidePhotos[side.id];assert.match(src,/^assets\/recipes\/side-[a-z_]+\.webp$/);const b=fs.readFileSync(path.join(root,src));assert.equal(b.toString('ascii',8,12),'WEBP');assert.ok(b.length<350000);bytes+=b.length;hashes.add(crypto.createHash('sha256').update(b).digest('hex'));}
assert.equal(hashes.size,455,'Toutes les illustrations restent distinctes.');
for(const file of ['index.html','app.js','photos.js','sw.js','style.css','design.css','version.js','recettes.js','prix-maxi.js','manifest.webmanifest'])assert.ok(fs.existsSync(path.join(root,file)),file);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(html.indexOf('photos.js')<html.indexOf('app.js'));const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)));
for(const f of ['robot-prix.yml','robot-speciaux.yml','cle-boite.yml'])assert.ok(fs.existsSync(path.join(root,'.github/workflows',f)));
console.log(`✓ 416 recettes et 39 accompagnements, 455 images distinctes, ${(bytes/1024/1024).toFixed(1)} Mo au total`);console.log('✓ scripts, PWA et automatisations présents');
