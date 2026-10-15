#!/bin/sh
# Construit la version de test dans dist/test/ (à téléverser dans le dépôt : elle sera servie à …/Menu/test/).
# Elle garde ses données à part (détection du dossier « test » dans version.js) et s'installe comme une app distincte.
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/test/js
cp index.html style.css version.js recettes.js prix-maxi.js sw.js qr-menu.png dist/test/
cp js/*.js dist/test/js/
cp icon-test-192.png dist/test/icon-192.png; cp icon-test-512.png dist/test/icon-512.png; cp apple-touch-icon-test.png dist/test/apple-touch-icon.png
cp qr-menu-test.png dist/test/qr-menu.png
sed -e 's/"name":"Menu de la semaine"/"name":"Menu de la semaine (TEST)"/' -e 's/"short_name":"Menu de la semaine"/"short_name":"Menu TEST"/' manifest.webmanifest > dist/test/manifest.webmanifest
sed -e 's/content="Menu de la semaine"/content="Menu TEST"/' -e 's#<title>Menu de la semaine</title>#<title>Menu TEST</title>#' index.html > dist/test/index.html
sed -i 's#mdulac86.github.io/Menu/">mdulac86.github.io/Menu#mdulac86.github.io/Menu/test/">mdulac86.github.io/Menu/test#; s#href="https://mdulac86.github.io/Menu/"#href="https://mdulac86.github.io/Menu/test/"#' dist/test/js/app.js
echo "Version de test prête dans dist/test/"
