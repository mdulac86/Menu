/* © 2026 mdulac86. Tous droits réservés. Reproduction, modification et publication interdites sans permission (voir LICENSE). */
/* Chiffrement des fichiers du robot avec le code de la famille (secret GitHub MENU_CLE).
   Le contenu est compressé (gzip), puis chiffré en AES-GCM 256 avec une clé tirée du code par PBKDF2-SHA256.
   L'application fait l'inverse dans le téléphone (dechiffrer, dans app.js). Le code n'est écrit nulle part. */
import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';

export const ITER = 210000;
/* le code tel qu'on le dit : sans majuscules, sans accents, espaces simples (« Tourtière  Castor » = « tourtiere castor ») */
export const codeNorm = c => String(c || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const cleDe = (code, salt, it) => pbkdf2Sync(codeNorm(code), salt, it, 32, 'sha256');

/* objet → enveloppe chiffrée. `clair` : quelques champs lisibles sans le code (la date, rien de personnel) */
export function chiffrer(obj, code, clair = {}){
  if(!codeNorm(code)) throw new Error('code de la famille absent (secret MENU_CLE)');
  const salt = randomBytes(16), iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', cleDe(code, salt, ITER), iv);
  const data = gzipSync(Buffer.from(JSON.stringify(obj), 'utf8'), { level: 9 });
  const ct = Buffer.concat([c.update(data), c.final(), c.getAuthTag()]);   /* comme WebCrypto : le contrôle à la fin */
  return Object.assign({ v: 1, chiffre: 'AES-GCM', kdf: 'PBKDF2-SHA256', it: ITER, z: 'gzip' }, clair,
    { salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') });
}

/* enveloppe → objet. Lance une erreur si le code n'est pas le bon */
export function dechiffrer(env, code){
  if(!env || env.v !== 1 || !env.ct) throw new Error('fichier chiffré illisible');
  const all = Buffer.from(env.ct, 'base64');
  const d = createDecipheriv('aes-256-gcm', cleDe(code, Buffer.from(env.salt, 'base64'), env.it), Buffer.from(env.iv, 'base64'));
  d.setAuthTag(all.subarray(all.length - 16));
  const data = Buffer.concat([d.update(all.subarray(0, all.length - 16)), d.final()]);
  return JSON.parse((env.z === 'gzip' ? gunzipSync(data) : data).toString('utf8'));
}
