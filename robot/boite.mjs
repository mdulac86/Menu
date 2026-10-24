/* © 2026 mdulac86. Tous droits réservés. Reproduction, modification et publication interdites sans permission (voir LICENSE). */
/* Clé de la boîte : chiffre la clé d'accès au dépôt privé de la famille (secret MENU_BOITE) avec le code de la famille
   (secret MENU_CLE) et l'écrit dans boite.enc.json. L'application s'en sert pour déposer ses demandes au robot
   (reels, photos du frigo) et pour lire la banque commune de recettes. La clé ne donne accès qu'au dépôt privé.
   Utilisation : node robot/boite.mjs   (rien n'est écrit si la clé et le code n'ont pas changé) */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chiffrer, dechiffrer } from './chiffre.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(RACINE, 'boite.enc.json');
const DEPOT = (process.env.MENU_DEPOT || 'mdulac86/menu-famille').trim();

async function main(){
  const code = (process.env.MENU_CLE || '').trim(), token = (process.env.MENU_BOITE || '').trim();
  if(!code){ console.log('Secret MENU_CLE absent.'); process.exit(1); }
  if(!token){ console.log('Secret MENU_BOITE absent : la boîte du robot n\'est pas encore installée (rien à faire).'); return; }
  const r = await fetch(`https://api.github.com/repos/${DEPOT}`, { headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'MenuDeLaSemaine-robot' } });
  if(!r.ok){ console.log(`La clé MENU_BOITE n'ouvre pas le dépôt ${DEPOT} (HTTP ${r.status}). Vérifie le dépôt choisi et la permission Contents.`); process.exit(1); }
  const info = await r.json();
  if(!info.private){ console.log(`Le dépôt ${DEPOT} n'est pas privé : la clé n'est pas publiée.`); process.exit(1); }
  try{ if(existsSync(SORTIE)){ const d = dechiffrer(JSON.parse(readFileSync(SORTIE, 'utf8')), code); if(d.token === token && d.depot === DEPOT){ console.log('Clé de la boîte déjà à jour.'); return; } } }
  catch(e){ /* code changé : on réécrit */ }
  writeFileSync(SORTIE, JSON.stringify(chiffrer({ depot: DEPOT, token }, code, { type: 'boite', maj: new Date().toISOString().slice(0, 10) })));
  console.log('Écrit : boite.enc.json (clé du dépôt privé, chiffrée avec le code de la famille).');
}
main();
