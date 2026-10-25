/* © 2026 mdulac86. Tous droits réservés. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist','test');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(root)){
  const src=path.join(root,name);
  if(fs.statSync(src).isFile() && /\.(html|js|css|json|png|webmanifest)$/.test(name))fs.copyFileSync(src,path.join(out,name));
}
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
const manifestPath=path.join(out,'manifest.webmanifest');const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));Object.assign(manifest,{name:'Menu TEST',short_name:'Menu TEST',id:'./',scope:'./',start_url:'./'});fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));
console.log('Version de test : '+out+' — données menu_test_ séparées.');
