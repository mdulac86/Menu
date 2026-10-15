/* Petit serveur de fichiers pour les tests (port 8765), démarré par chaque test. */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.env.RACINE || path.join(__dirname, '..');
const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webmanifest':'application/manifest+json'};
module.exports = () => new Promise(res => {
  const srv = http.createServer((req, rep) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p); if(!f.startsWith(ROOT) || !fs.existsSync(f)){ rep.writeHead(404); return rep.end(); }
    rep.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(rep);
  });
  srv.on('error', () => res(null));   /* port déjà pris : un serveur tourne déjà */
  srv.listen(8765, () => res(srv));
});
