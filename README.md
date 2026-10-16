# Menu de la semaine

Planificateur de repas familial : il cherche les spéciaux de la semaine dans les circulaires (Flipp), bâtit un menu varié qui en profite, puis la liste d'épicerie avec un coût estimé, une limite de budget et des suggestions de réserves quand un produit est vraiment en spécial.

Site : <https://mdulac86.github.io/Menu/>. C'est une application web installable (PWA). Elle fonctionne hors ligne et garde les données sur l'appareil.

## Fichiers

| Fichier | Contenu |
|---|---|
| `index.html` | La page : en-tête, sections, barre d'onglets, chargement des scripts |
| `style.css` | L'apparence, en mode clair et sombre |
| `version.js` | **La version de l'application**, le canal (test si le dossier s'appelle `test`) et l'adresse de contact |
| `recettes.js` | Les données des recettes (`RECIPES`) et des accompagnements (`SIDES`) |
| `prix-maxi.js` | Les prix de référence : barème Maxi (`BAREME`), prix moyens (`PRIX`, `PRIX_DEF`) et date du relevé (`PRIX_MAJ`) |
| `js/base.js` | Utilitaires, état des données, sauvegarde et protection |
| `js/plats.js` | Recettes : variantes, accompagnements, portions, mode Cuisiner, importation |
| `js/semaine.js` | Variété, jours de la semaine, dîners et restes |
| `js/liste-prix.js` | Liste d'épicerie, prix, barème et association des spéciaux |
| `js/generation.js` | Génération du menu, budget, recherche des circulaires (Flipp) |
| `js/epiceries.js` | Prix par épicerie (relevé du robot, écart avec Maxi) et comparateur « Où faire l'épicerie » |
| `js/ecrans.js` | Écrans : menu, épicerie, maison, recettes, articles, prix |
| `js/profil.js` | Profil de la famille, assistant de départ, réglages, accueil Ma semaine |
| `js/app.js` | Navigation, actions, aide et démarrage (chargé en dernier) |
| `sw.js` | Le service worker : réseau d'abord, copie gardée hors ligne |
| `prix-epiceries.json` | Le dernier relevé des prix de Maxi et d'IGA, écrit par le robot (ne pas modifier à la main) |
| `robot/` | Le robot des prix : `releve.mjs`, les magasins (`magasins.json`) et les mots cherchés (`termes.json`) |
| `.github/workflows/robot-prix.yml` | Lance le robot chaque jeudi matin |
| `outils/construire-test.sh` | Construit la version de test dans `dist/test/` |
| `tests/`, `.github/workflows/tests.yml` | Tests automatiques (pour le développement) |

Les fichiers de `js/` sont des scripts ordinaires qui partagent leurs variables : l'ordre de chargement dans `index.html` compte.

## Version de test

`sh outils/construire-test.sh` produit `dist/test/`. Ce dossier se téléverse dans le dépôt sous `test/` : il est servi à `…/Menu/test/`.
Il garde ses données à part (clés `menu_test_*`, cache `menu-test-*`), s'installe comme une app distincte (« Menu TEST », icône orange) et affiche un bandeau. Profil → Sauvegarde → « Copier mes vraies données » le remplit à partir de la version familiale du même téléphone, sans la modifier.

## Navigation (2.0)

Cinq onglets : Ma semaine (accueil selon le jour), Menu (Semaine, Historique), Épicerie (Liste, Articles, Prix, Maison), Recettes, Profil (Famille, Horaire, Épiceries, Budget et prix, Sauvegarde, Apparence, Aide).

## Ce soir, on mange quoi ? (2.2)

Un panneau dans Ma semaine et dans Menu (`renderAvec`, dans `app.js`), avec le nombre de personnes :

- **J'ai le goût de…** : on cherche un plat (ex. jalapeños poppers). `pairWith()` propose un plat principal (ou une entrée, si le plat choisi est un souper) et un dessert. Le score tient compte de l'ambiance (`THEMES` : pub, mexicaine, italienne, asiatique, grecque, raffinée, québécoise), du même appareil (même fumoir, BBQ déjà chaud), évite les mêmes ingrédients principaux et les plats trop longs pour un soir, et favorise ce qui est à la maison. « Ce soir, ensemble » met les deux au menu.
- **Avec ce qu'on a à la maison** : `fitStock()` compare une recette, pour le nombre de personnes, à Maison (75 % de la quantité suffit). Les condiments et le garde-manger rarement notés (`COND_RE` : sauces, bouillon, épices, farine…) ne bloquent pas un plat : ils sont « à vérifier ». Liste « Tout est à la maison », puis « Il manque un article ». Les accompagnements viennent aussi de la maison (`maisonSides`).
- **Menu de la semaine avec ce qu'on a** : `genMenuMaison()` crée le menu en partageant le stock entre les plats (`STK`, consommé à chaque choix). Le menu porte `maison: true` : aucun dîner acheté n'est ajouté.

## Façons de cuire : air fryer, mijoteuse, four (2.3)

77 recettes ont d'autres façons de cuire, avec les mêmes ingrédients : 34 à l'air fryer, 21 à la mijoteuse, 29 au four (pour les recettes BBQ, plancha, poêle ou fumoir). Chaque façon a ses propres temps et ses propres étapes (champ `cm`, voir plus bas).

- **Menu** : chaque plat a un choix « Cuisson ». Le choix est gardé dans le plat (`it.cm`; `b` = la recette de base) et change le temps affiché, les étapes, le mode Cuisiner, la carte Aujourd'hui et les textes copiés.
- **Soir de semaine** : sans choix, un plat trop long pour un soir de semaine prend tout seul la façon qui le rend possible (ex. côtes levées fumées → mijoteuse), et le plat le dit (`cmEff`). Les jours de congé, c'est la recette de base.
- **Mode Cuisiner** : on peut changer de façon au moment de cuisiner. Pour un plat du menu, le choix est gardé.
- **J'ai le goût de…** : « Comment le faire » montre chaque façon avec son temps et indique la plus rapide. « Recette » et « Ce soir, ensemble » gardent la façon choisie.
- **Recherche** : les autres noms d'un plat comptent (champ `al`, ex. « parmigiana » → Poulet au parmesan), et les lettres doublées sont ignorées (« popers » trouve « poppers »).
- **Recettes** : filtre « Air fryer », le filtre « Mijoteuse » inclut les recettes qui ont une version mijoteuse, et la fiche montre « Autres façons de le cuire ».

## Mettre une nouvelle version en ligne

1. Changer la date dans `version.js`, par exemple `'2026-11-02a'`.
2. Téléverser **tous les fichiers modifiés dans le même envoi** (un seul « commit »). Sinon, un téléphone pourrait recevoir un `index.html` neuf avec un vieil `app.js`.
3. À la prochaine ouverture, l'application garde une copie des données (« Avant la mise à jour »), installe la nouvelle version, puis se recharge une fois.

## Mettre à jour les prix de référence

Les prix réguliers servent quand un article n'est pas en spécial. Ils sont dans `prix-maxi.js` :

- `PRIX_MAJ` : date du relevé (AAAA-MM-JJ). Après 4 mois, l'application avertit que les prix sont vieux.
- `BAREME` : `[expression, {u, f:[[format, prix], …], kg, gpu, e}]`. `u` est l'unité (`g`, `ml` ou `un`). `f` donne les formats vendus avec leur prix régulier. `kg` est le prix au kilo pour ce qui se vend au poids. `gpu` est le poids d'une unité. `e:1` marque un prix estimé.
- `PRIX` : `[expression, {kg, L, un}]` pour les prix moyens au kilo, au litre ou à l'unité.

Dans l'application, l'onglet **Articles → Prix** permet de faire la mise à jour soi-même, une fois par mois :

- la liste montre les 40 articles qui comptent le plus dans l'épicerie, chacun avec un lien vers maxi.ca et le prix régulier vu dans les circulaires ;
- le prix inscrit pour un format remplace celui du fichier (`S.bx`) ;
- un ajustement en % s'applique à tous les autres prix (`S.pmaj.pct`), par exemple pour suivre l'inflation ;
- « J'ai terminé la mise à jour » note la date (`S.pmaj.d`). Un rappel apparaît dans l'onglet Menu 30 jours plus tard. Il peut être remis d'une semaine, ou désactivé dans Réglages.

L'application ne peut pas lire maxi.ca elle-même : le site bloque les requêtes venant d'une autre page. C'est pourquoi le prix s'inscrit à la main.

Trois autres choses corrigent aussi ces prix :

- le prix payé, inscrit dans la liste d'épicerie ;
- le prix habituel, inscrit dans l'onglet Articles ;
- le prix habituel déduit des circulaires qui indiquent leur rabais.

## Prix par épicerie et « Où faire l'épicerie »

Chaque jeudi à 6 h 17 (heure du Québec), GitHub lance le robot (`robot/releve.mjs`). Pour chaque article du barème, il cherche le produit chez Maxi (l'API PC Express, la même que maxi.ca) et chez IGA (le catalogue Algolia d'iga.ca), pour les magasins de `robot/magasins.json`. Il garde le meilleur prix régulier et la promotion en cours pour chaque format du barème et, à part (`m`, ou `mk` au kilo), le meilleur prix d'une marque connue (pas Sans Nom, le Choix du Président, Compliments…; `1` = le moins cher est déjà une marque connue). Il écrit le tout dans `prix-epiceries.json`. Si un site refuse, les prix précédents de ce magasin sont gardés et l'erreur est notée. Walmart bloque les robots : il n'est pas relevé.

Le choix du produit suit les mêmes expressions que le barème : le nom (sans la marque ni le format) doit commencer par l'article, et ne pas annoncer une autre forme (nourriture pour chien, soupe, pané, cuit…). Un prix relevé à plus de 2,2 fois ou moins de 0,4 fois la référence Maxi est ignoré par l'application.

Dans l'application (`js/epiceries.js`), le prix d'un article dans une épicerie vient de ton prix payé chez elle, sinon du relevé, sinon, pour une épicerie sans relevé, du prix de la marque connue (moyenne Maxi et IGA), sinon de la référence Maxi × l'écart de l'épicerie (médiane calculée sur le relevé pour IGA; valeur de départ `ECART0` pour les autres). Un spécial de la circulaire ou une promotion du relevé, valide le jour de l'épicerie, le remplace s'il coûte moins. Le comparateur additionne la liste dans chaque épicerie, puis essaie toutes les combinaisons de 2 à 4 épiceries : un article quitte l'épicerie principale seulement s'il y coûte au moins 3 % et 0,25 $ de moins.

Pour ajouter un magasin : trouver son numéro (Maxi : `api.pcexpress.ca/pcx-bff/api/v1/pickup-locations?bannerIds=maxi`; IGA : l'index `dxp_stores_fr`), l'ajouter dans `robot/magasins.json`, puis lancer le robot à la main (Actions → Robot des prix → Run workflow). Tests du robot sans réseau : `node tests/robot.js`.

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
| `cm` | Autres façons de cuire : `{b: "Four", af: {tp, tm, s}, mj: {…}, four: {…}}`. `b` nomme la façon de la recette de base; `af` = air fryer, `mj` = mijoteuse, `four` = four. Chaque façon a ses temps (`tp`, `tm`) et ses étapes (`s`), avec les mêmes ingrédients |
| `al` | Autres noms pour la recherche (ex. `["parmigiana", "chicken parm"]`) |

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
node tests/scenario.js      # une semaine complète sur écran d'iPhone, avec de vraies circulaires simulées
node tests/unit.js          # association, prix, analyse de recettes, budget, sauvegardes
node tests/smoke.js 400 1   # 400 clics au hasard : aucune erreur JavaScript permise
node tests/horsligne.js     # installation et ouverture sans connexion
node tests/matching.js sortie.txt   # associations sur 3 236 vrais produits de circulaires (15 oct. 2026)
node tests/perf.js          # temps des calculs lourds, processeur ralenti ×4
node tests/epiceries.js     # prix par épicerie et comparateur, sur écran d'iPhone
node tests/robot.js         # choix des produits par le robot (sans réseau)
RACINE_VIEUX=/chemin/ancienne/version node tests/migration.js   # données gardées après une mise à jour
```
