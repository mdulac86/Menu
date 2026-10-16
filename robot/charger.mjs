/* Charge le barème de l'application (prix-maxi.js) pour que le robot utilise exactement les mêmes articles. */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(readFileSync(path.join(RACINE, 'prix-maxi.js'), 'utf8') + ';this.BAREME = BAREME;', ctx);
export const BAREME = ctx.BAREME;
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');
export const cle = b => b[0].source;
/* terme de recherche tiré de l'expression : première variante, sans la syntaxe des expressions */
export function terme(src){
  let s = src.split('|')[0];
  s = s.replace(/\(\?![^)]*\)/g, '').replace(/\\b|\^|\$/g, '').replace(/\\\([^)]*\\\)/g, '');
  s = s.replace(/\(([^)|]*)(\|[^)]*)?\)\??/g, '$1').replace(/([a-z])s\?/g, '$1s').replace(/\?/g, '').replace(/\.\*?/g, ' ').replace(/\\/g, '');
  return s.replace(/\s+/g, ' ').trim();
}
