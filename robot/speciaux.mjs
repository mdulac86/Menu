/* © 2026 mdulac86. Tous droits réservés. Reproduction, modification et publication interdites sans permission (voir LICENSE). */
/* Robot des spéciaux : lit une fois par semaine les circulaires d'épicerie (Flipp) pour les codes postaux de la famille,
   et les écrit chiffrées dans speciaux.enc.json. L'application les lit avec le code de la famille, sans interroger Flipp.
   Secrets GitHub (Settings → Secrets and variables → Actions) :
     MENU_CLE : le code de la famille (le même que dans l'application);
     MENU_CP  : un ou plusieurs codes postaux, séparés par des virgules (ex. A1A1A1, B2B 2B2).
   Les codes postaux et les spéciaux ne sont jamais écrits en clair, ni dans le dépôt, ni dans le journal (public).
   Poli : une circulaire à la fois, une pause entre chaque, un nom de robot honnête.
   Utilisation : node robot/speciaux.mjs */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chiffrer, dechiffrer } from './chiffre.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(RACINE, 'speciaux.enc.json');
const FLIPP = 'https://backflipp.wishabi.com/flipp';
const UA = 'MenuDeLaSemaine-robot/1.0 (usage familial, une lecture par semaine)';
const MAX_CIRC = 40;            /* circulaires par code postal, au plus */
const pause = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const jour = d => new Date(d).toISOString().slice(0, 10);

/* mêmes règles que l'application : les circulaires d'épicerie (et de pharmacie, pour quelques aliments) */
export const epicerie = f => { const c = norm([].concat(f.categories || []).join(' ') + ' ' + (f.categories_csv || ''));
  return !c.trim() || (/grocer|epicer|aliment|food|pharm/.test(c) && !/restaurant/.test(c)); };
/* une circulaire utile : en vigueur, ou qui commence dans les 8 prochains jours */
export const utile = (f, auj) => { const fin = String(f.valid_to || '').slice(0, 10), deb = String(f.valid_from || '').slice(0, 10);
  return (!fin || fin >= auj) && (!deb || deb <= jour(Date.parse(auj + 'T12:00:00Z') + 8 * 864e5)); };

/* champs gardés : ceux que l'application lit (nom, prix, prix au poids, rabais, prix régulier, dates) */
const CHAMPS = ['name', 'price', 'current_price', 'price_text', 'pre_price_text', 'post_price_text', 'sale_story', 'original_price', 'discount', 'valid_from', 'valid_to'];
export function article(it){
  if(!it || !it.name) return null;
  const o = {};
  CHAMPS.forEach(k => { const v = it[k]; if(v === null || v === undefined || v === '') return; o[k] = typeof v === 'string' ? v.slice(0, k === 'name' ? 200 : 80) : v; });
  /* vendu au poids : code « _KG » (le prix affiché est à la livre) */
  const pid = String(it.print_id || it.sku || ''); if(/_KG$/i.test(pid)) o.print_id = pid.slice(-20);
  if(o.price === undefined && o.current_price === undefined) return null;
  return o;
}
const listeDe = d => Array.isArray(d) ? d : d && Array.isArray(d.items) ? d.items : d && Array.isArray(d.flyers) ? d.flyers : null;

/* lecture pour un code postal. `lire(url)` rend le JSON (remplacé dans les tests) */
export async function zone(cp, lire, auj, attente = 1500){
  const fl = listeDe(await lire(`${FLIPP}/flyers?locale=fr-ca&postal_code=${encodeURIComponent(cp)}`));
  if(!fl) throw new Error('liste des circulaires illisible');
  const flyers = fl.filter(f => f && f.id && f.merchant && epicerie(f) && utile(f, auj)).slice(0, MAX_CIRC)
    .map(f => ({ id: f.id, merchant: String(f.merchant).slice(0, 80), valid_from: f.valid_from || '', valid_to: f.valid_to || '', categories_csv: String(f.categories_csv || [].concat(f.categories || []).join(',')).slice(0, 120) }));
  const items = {}; let ok = 0, err = 0;
  for(const f of flyers){
    try{
      const L = listeDe(await lire(`${FLIPP}/flyers/${f.id}?locale=fr-ca&postal_code=${encodeURIComponent(cp)}`));
      if(!L) throw new Error('circulaire illisible');
      items[f.id] = L.map(article).filter(Boolean); ok++;
    }catch(e){ err++; }
    if(attente) await pause(attente);
  }
  if(flyers.length && !ok) throw new Error('aucune circulaire lisible');
  return { cp, flyers: flyers.filter(f => items[f.id]), items, ok, err };
}

async function lireWeb(url){
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20000);
  try{
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: ac.signal });
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

/* relevé complet : chaque code postal; une zone qui échoue garde ses spéciaux précédents */
export async function releve(cps, code, lire = lireWeb, auj = jour(Date.now()), avant = null, attente = 1500){
  const res = { v: 1, maj: new Date().toISOString(), zones: [] }; let bons = 0;
  for(let i = 0; i < cps.length; i++){
    const t0 = Date.now();
    try{
      const z = await zone(cps[i], lire, auj, attente); bons++;
      res.zones.push({ cp: z.cp, d: auj, flyers: z.flyers, items: z.items });
      const n = Object.values(z.items).reduce((a, L) => a + L.length, 0);
      console.log(`Zone ${i + 1} : ${z.flyers.length} circulaires, ${n} articles${z.err ? `, ${z.err} illisible(s)` : ''} (${Math.round((Date.now() - t0) / 1000)} s)`);
    }catch(e){
      const vieux = avant && Array.isArray(avant.zones) ? avant.zones.find(z => z.cp === cps[i]) : null;
      if(vieux) res.zones.push(vieux);
      console.log(`Zone ${i + 1} : ÉCHEC, ${String(e.message || e).slice(0, 120)}${vieux ? ' (spéciaux précédents gardés)' : ''}`);
    }
  }
  return { res, bons };
}

async function main(){
  const code = (process.env.MENU_CLE || '').trim();
  const cps = [...new Set((process.env.MENU_CP || '').split(/[,;\n]+/).map(s => s.replace(/\s/g, '').toUpperCase()).filter(s => /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(s)))];
  if(!code){ console.log('Secret MENU_CLE absent : ajoute le code de la famille dans Settings → Secrets and variables → Actions.'); process.exit(1); }
  if(!cps.length){ console.log('Secret MENU_CP absent ou invalide : ajoute au moins un code postal (ex. A1A1A1).'); process.exit(1); }
  let avant = null;
  try{ if(existsSync(SORTIE)) avant = dechiffrer(JSON.parse(readFileSync(SORTIE, 'utf8')), code); }
  catch(e){ console.log('Fichier précédent illisible avec ce code (le code a changé ?) : on repart de zéro.'); }
  const { res, bons } = await releve(cps, code, lireWeb, jour(Date.now()), avant);
  if(!res.zones.length){ console.log('Aucun spécial lu : le fichier précédent est gardé.'); process.exit(1); }
  const env = chiffrer(res, code, { type: 'speciaux', maj: res.maj.slice(0, 10) });
  writeFileSync(SORTIE, JSON.stringify(env));
  console.log(`Écrit : speciaux.enc.json (${Math.round(JSON.stringify(env).length / 1024)} ko, ${res.zones.length} zone(s), ${bons} lue(s) cette fois-ci)`);
  if(!bons) process.exit(1);
}
if(import.meta.url === `file://${process.argv[1]}`) main();
