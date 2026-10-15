# Menu de la semaine

Planificateur de repas familial : il cherche les spéciaux de la semaine dans les circulaires (Flipp), bâtit un menu varié qui en profite, puis la liste d'épicerie avec un coût estimé, une limite de budget et des suggestions de réserves quand un produit est vraiment en spécial.

Site : <https://mdulac86.github.io/Menu/>. C'est une application web installable (PWA). Elle fonctionne hors ligne et garde les données sur l'appareil.

## Fichiers

| Fichier | Contenu |
|---|---|
| `index.html` | La page : en-tête, onglets, chargement des scripts |
| `style.css` | L'apparence, en mode clair et sombre |
| `version.js` | **La version de l'application**, à changer à chaque mise en ligne |
| `recettes.js` | Les données des recettes (`RECIPES`) et des accompagnements (`SIDES`) |
| `prix-maxi.js` | Les prix de référence : barème Maxi (`BAREME`), prix moyens (`PRIX`, `PRIX_DEF`) et date du relevé (`PRIX_MAJ`) |
| `app.js` | Toute la logique de l'application |
| `sw.js` | Le service worker : il va d'abord au réseau, puis à la copie gardée si on est hors ligne |
| `manifest.webmanifest`, icônes | L'installation sur l'écran d'accueil |
| `tests/` | Tests automatiques (pour le développement, pas utilisés par le site) |

## Mettre une nouvelle version en ligne

1. Changer la date dans `version.js`, par exemple `'2026-11-02a'`.
2. Téléverser **tous les fichiers modifiés dans le même envoi** (un seul « commit »). Sinon, un téléphone pourrait recevoir un `index.html` neuf avec un vieil `app.js`.
3. À la prochaine ouverture, l'application garde une copie des données (« Avant la mise à jour »), installe la nouvelle version, puis se recharge une fois.

## Mettre à jour les prix de référence

Les prix réguliers servent quand un article n'est pas en spécial. Ils sont dans `prix-maxi.js` :

- `PRIX_MAJ` : date du relevé (AAAA-MM-JJ). Après 4 mois, l'application avertit que les prix sont vieux.
- `BAREME` : `[expression, {u, f:[[format, prix], …], kg, gpu, e}]`. `u` est l'unité (`g`, `ml` ou `un`). `f` donne les formats vendus avec leur prix régulier. `kg` est le prix au kilo pour ce qui se vend au poids. `gpu` est le poids d'une unité. `e:1` marque un prix estimé.
- `PRIX` : `[expression, {kg, L, un}]` pour les prix moyens au kilo, au litre ou à l'unité.

Dans l'application, trois choses corrigent ces prix sans toucher au fichier :

- le prix payé, inscrit dans la liste d'épicerie ;
- le prix habituel, inscrit dans l'onglet Articles ;
- le prix habituel déduit des circulaires qui indiquent leur rabais.

## Association spéciaux ↔ articles

Un nom de circulaire est nettoyé : la partie anglaise après `|` et les formats sont retirés. Il est ensuite coupé aux « ou » en segments. Les mots partagés sont recopiés : « Poitrines ou cuisses de poulet » donne aussi « poitrines de poulet ». Un article correspond à un segment seulement si son mot principal est le produit lui-même :

- rien devant le mot principal, sauf une marque, une coupe (« Poitrines de… ») ou un format (« Sac de… »). « Nouilles aux oeufs » est donc refusé pour Oeufs ;
- pas de préparation ou de forme absente du nom de l'article : pané, mariné, teriyaki, « en dés », fumé…
- jamais de friandises (Kinder, Cadbury, Halloween…) pour un aliment de base ;
- pour les variétés de fromage et de lait, les pourcentages (crème 35 %, lait 2 %) et les conserves, il faut la bonne variété.

Dans l'onglet Articles, le bouton « Pas ce produit » écarte pour toujours un produit mal associé. Les mots cherchés et les mots exclus se règlent article par article.

## Format des données

### Recette (`RECIPES`)

| Champ | Sens |
|---|---|
| `n` | Nom (sert d'identifiant) |
| `k` | Sorte : `souper` (par défaut), `dejeuner`, `entree`, `soupe`, `dessert`, `sauce` |
| `e` | Émojis |
| `m` | Mots-clés à chercher dans les circulaires (ex. `["porc haché", "boeuf haché"]`) |
| `i` | Ingrédients pour 6 portions : `[quantité, unité g/ml/un, nom, rayon]` |
| `s` | Préparation, en texte |
| `v` | Versions : `[nom, changements]`. Les changements s'écrivent `-ingrédient ; +700 g ingrédient\|rayon`. Un 3ᵉ élément facultatif donne une étape propre à la version |
| `t` | Genre de plat pour les accompagnements : `viande`, `pates`, `riz`, `sandwich`, `mex`, `complet` |
| `sf`, `sv` | Accompagnements par défaut (féculent et légume) : un `id` de `SIDES`, `auto` ou vide |
| `tp`, `tm` | Temps de préparation et temps total (minutes) |
| `mj` | 1 = recette à la mijoteuse, 2 = braisé qui peut aller à la mijoteuse |
| `pr`, `st` | Protéine principale et styles (catégories d'affichage) |
| `pp` | Produit prêt à servir, suggéré surtout s'il est en spécial |
| `sp` | Recette simple (déjeuners de semaine, desserts rapides) |
| `nw` | Marquée « Nouveau » |
| `rs` | Plat qui laisse des restes : `{lbl, w:[mots], x:[ingrédients en plus]}` |
| `ur` | Plat qui utilise des restes (mots qui doivent correspondre à `rs.w`) |

### Accompagnement (`SIDES`)

`{id, n, sl, ty, i, s}`. `sl` vaut `f` (féculent) ou `v` (légume). `ty` donne les genres de plats compatibles (ou `all`). `i` et `s` ont le même format que pour une recette.

### Données de l'utilisateur

Tout est dans `localStorage`, sous la clé `menu_epicerie_v1`. C'est un seul objet `S` ; voir `DEFAULT()` dans `app.js`. Les principales parties :

- `menu` : le menu de la semaine (`items` pour les soupers, `din`, `dej`, `ent`, `sou`, `des`) et l'état de la liste (`chk`, `extra`, `achete`) ;
- `stock` : ce qu'il y a à la maison ;
- `hist` : les 26 dernières semaines ;
- `custom` : les recettes ajoutées par l'utilisateur ;
- `auto` : les spéciaux trouvés dans les circulaires ;
- `prices`, `ph`, `art` : les prix notés, l'historique des spéciaux et les réglages par article ;
- `p` : les réglages (portions, nombre de repas, budget…).

Protections :

- une copie automatique par jour, une avant chaque mise à jour, une avant chaque restauration (5 au maximum, clé `menu_epicerie_copies`) ;
- les données illisibles sont mises de côté (`menu_epicerie_secours`) sans rien écraser ;
- une sauvegarde peut être exportée dans Fichiers. Elle est vérifiée avant d'être restaurée.

## Tests

Il faut Node.js et `playwright-core` avec un Chromium. Chaque test démarre son propre petit serveur.

```
node tests/unit.js          # association, prix, analyse de recettes, budget, sauvegardes
node tests/smoke.js 400 1   # 400 clics au hasard : aucune erreur JavaScript permise
node tests/horsligne.js     # installation et ouverture sans connexion
node tests/matching.js sortie.txt   # associations sur 3 236 vrais produits de circulaires (15 oct. 2026)
node tests/perf.js          # temps des calculs lourds, processeur ralenti ×4
RACINE_VIEUX=/chemin/ancienne/version node tests/migration.js   # données gardées après une mise à jour
```
