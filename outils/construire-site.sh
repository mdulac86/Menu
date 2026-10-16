#!/bin/sh
# Construit le site à publier dans dist/site/ : tous les fichiers à plat (aucun dossier),
# parce que le téléversement sur GitHub depuis le téléphone ou le navigateur ne garde pas les dossiers.
# Les scripts de js/ sont réunis dans un seul app.js, dans l'ordre de index.html.
set -e
cd "$(dirname "$0")/.."
rm -rf dist/site && mkdir -p dist/site
cp style.css version.js recettes.js prix-maxi.js manifest.webmanifest icon-192.png icon-512.png apple-touch-icon.png qr-menu.png dist/site/
for f in base plats semaine liste-prix generation epiceries ecrans profil app; do cat js/$f.js; echo; done > dist/site/app.js
python3 - <<'PY'
import re
s = open('index.html', encoding='utf8').read()
s = re.sub(r'(<script src="js/[a-z-]+\.js"></script>\n?)+', '<script src="app.js"></script>\n', s)
open('dist/site/index.html', 'w', encoding='utf8').write(s)
w = open('sw.js', encoding='utf8').read()
w = re.sub(r"'js/base\.js',.*?'js/app\.js',", "'app.js',", w)
open('dist/site/sw.js', 'w', encoding='utf8').write(w)
PY
grep -q 'src="app.js"' dist/site/index.html && ! grep -q 'js/' dist/site/sw.js
echo "Site prêt dans dist/site/ : $(ls dist/site | wc -l) fichiers, aucun dossier."
