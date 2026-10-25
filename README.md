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
| `manifest.webmanifest`, icônes | L'installation sur l'écran d'accueil. `icon-maskable-512.png` est l'icône d'Android (le panier au centre, pour que le cercle ou le carré arrondi ne le coupe pas) |
| `LICENSE` | Droits d'auteur : tous droits réservés |
| `prix-epiceries.enc.json` | Le dernier relevé des prix de Maxi et d'IGA, chiffré avec le code de la famille, écrit par le robot (ne pas modifier à la main). Sans le secret `MENU_CLE`, le robot écrit plutôt `prix-epiceries.json` en clair |
| `speciaux.enc.json` | Les spéciaux des circulaires, chiffrés avec le code de la famille, écrits par le robot des spéciaux |
| `robot/` | Les robots : `releve.mjs` (prix), `speciaux.mjs` (circulaires), `chiffre.mjs` (chiffrement), les magasins (`magasins.json`) et les mots cherchés (`termes.json`) |
| `.github/workflows/robot-prix.yml` | Lance le robot des prix chaque jeudi matin |
| `.github/workflows/robot-speciaux.yml` | Lance le robot des spéciaux le mercredi soir et le jeudi matin |
| `outils/construire-test.sh` | Construit la version de test dans `dist/test/` |
| `tests/`, `.github/workflows/tests.yml` | Tests automatiques (pour le développement) |

Les fichiers de `js/` sont des scripts ordinaires qui partagent leurs variables : l'ordre de chargement dans `index.html` compte.

## Version de test

`sh outils/construire-test.sh` produit `dist/test/`. Ce dossier se téléverse dans le dépôt sous `test/` : il est servi à `…/Menu/test/`.
Il garde ses données à part (clés `menu_test_*`, cache `menu-test-*`), s'installe comme une app distincte (« Menu TEST », icône orange) et affiche un bandeau. Profil → Sauvegarde → « Copier mes vraies données » le remplit à partir de la version familiale du même téléphone, sans la modifier.

## Navigation (2.0)

Cinq onglets : Ma semaine (accueil selon le jour), Menu (Semaine, Historique), Épicerie (Liste, Articles, Prix, Maison), Recettes, Profil (Famille, Horaire, Épiceries, Budget et prix, Sauvegarde, Apparence, Aide).

## Ce soir, on mange quoi ?

Un panneau dans Ma semaine et dans Menu (`renderAvec`, dans `app.js`), avec le nombre de personnes :

- **J'ai le goût de…** : on cherche un plat (ex. jalapeños poppers). `pairWith()` propose un plat principal (ou une entrée, si le plat choisi est un souper) et un dessert. Le score tient compte de l'ambiance (`THEMES` : pub, mexicaine, italienne, asiatique, grecque, raffinée, québécoise), du même appareil (même fumoir, BBQ déjà chaud), évite les mêmes ingrédients principaux et les plats trop longs pour un soir, et favorise ce qui est à la maison. « Ce soir, ensemble » met les deux au menu.
- **Avec ce qu'on a à la maison** : `fitStock()` compare une recette, pour le nombre de personnes, à Maison (75 % de la quantité suffit). Les condiments et le garde-manger rarement notés (`COND_RE` : sauces, bouillon, épices, farine…) ne bloquent pas un plat : ils sont « à vérifier ». Liste « Tout est à la maison », puis « Il manque un article ». Les accompagnements viennent aussi de la maison (`maisonSides`).
- **Menu de la semaine avec ce qu'on a** : `genMenuMaison()` crée le menu en partageant le stock entre les plats (`STK`, consommé à chaque choix). Le menu porte `maison: true` : aucun dîner acheté n'est ajouté.

## Façons de cuire : air fryer, mijoteuse, four

77 recettes ont d'autres façons de cuire, avec les mêmes ingrédients : 34 à l'air fryer, 21 à la mijoteuse, 29 au four (pour les recettes BBQ, plancha, poêle ou fumoir). Chaque façon a ses propres temps et ses propres étapes (champ `cm`, voir plus bas).

- **Menu** : chaque plat a un choix « Cuisson ». Le choix est gardé dans le plat (`it.cm`; `b` = la recette de base) et change le temps affiché, les étapes, le mode Cuisiner, la carte Aujourd'hui et les textes copiés.
- **Soir de semaine** : sans choix, un plat trop long pour un soir de semaine prend tout seul la façon qui le rend possible (ex. côtes levées fumées → mijoteuse), et le plat le dit (`cmEff`). Les jours de congé, c'est la recette de base.
- **Mode Cuisiner** : on peut changer de façon au moment de cuisiner. Pour un plat du menu, le choix est gardé.
- **J'ai le goût de…** : « Comment le faire » montre chaque façon avec son temps et indique la plus rapide. « Recette » et « Ce soir, ensemble » gardent la façon choisie.
- **Recherche** : les autres noms d'un plat comptent (champ `al`, ex. « parmigiana » → Poulet au parmesan), et les lettres doublées sont ignorées (« popers » trouve « poppers »).
- **Recettes** : filtre « Air fryer », le filtre « Mijoteuse » inclut les recettes qui ont une version mijoteuse, et la fiche montre « Autres façons de le cuire ».

## iPhone et Android

`IOS` et `ANDROID` (dans `app.js`, d'après le navigateur) adaptent l'application au téléphone :

- **Installer** : l'aide montre d'abord les étapes du téléphone utilisé (Safari et « Sur l'écran d'accueil », ou Chrome et « Installer l'application »). Sur Android, Chrome propose l'installation (`beforeinstallprompt`) : une carte « Installer l'application » apparaît dans Ma semaine, avec « Plus tard » (`S.instHide`).
- **Bouton Retour d'Android** : il ferme Cuisiner, quitte le mode magasin, revient à Ma semaine, et seulement ensuite quitte l'application (`navSync`, une seule entrée d'historique, l'adresse ne change pas). Le glissement retour de Safari fait la même chose.
- **Sauvegarde** : sur iPhone, le partage (« Enregistrer dans Fichiers », raccourci « Sauvegarde Menu »). Sur Android, le fichier va dans Téléchargements, et « Envoyer une copie » l'envoie à Google Drive ou par courriel (`saveFile`). Le profil et l'image du frigo suivent la même règle.
- **Données** : sur Android, l'application installée et Chrome partagent les mêmes données. Sur iPhone, Safari et l'icône ne les partagent pas : il faut installer avant d'entrer quoi que ce soit.

## Code de la famille et robot des spéciaux

Les spéciaux et les prix relevés sont réservés à la famille et aux amis. Un robot GitHub lit les circulaires (Flipp) une fois par semaine pour les codes postaux de la famille. Le robot des prix fait de même pour Maxi et IGA. Les deux chiffrent leur résultat avec le **code de la famille** : `speciaux.enc.json` et `prix-epiceries.enc.json` ne sont lisibles qu'avec ce code. Le téléphone ne questionne plus Flipp; il lit ces fichiers.

**Mise en place (une fois)** — dans GitHub : Settings → Secrets and variables → Actions → New repository secret :

- `MENU_CLE` : le code de la famille (une phrase facile à dire, difficile à deviner). C'est le même code que chaque personne entre dans l'application. Les majuscules, les accents et les espaces en trop ne comptent pas (`codeNorm`).
- `MENU_CP` : le ou les codes postaux de la famille, séparés par des virgules (ex. `A1A1A1, B2B2B2`). Un code par région suffit : les circulaires sont les mêmes dans une région.

Puis : Actions → Robot des spéciaux → Run workflow, et Actions → Robot des prix → Run workflow. Le robot des prix retire alors `prix-epiceries.json` (en clair) du dépôt.

**Dans l'application** : Profil → Épiceries → Code de la famille. Le code reste sur le téléphone (clé `menu_epicerie_code`, hors des sauvegardes). Sans code : pas de recherche des spéciaux, et le menu se fait sans eux; les prix restent estimés. Avec le code : les spéciaux viennent du fichier du robot; Flipp n'est questionné qu'en secours, si le fichier manque ou ne couvre pas le jour de l'épicerie.

**Changer le code** : modifier le secret `MENU_CLE`, relancer les deux robots, puis donner le nouveau code. Les téléphones qui ont l'ancien voient « le code de la famille a changé ».

**Chiffrement** (`robot/chiffre.mjs`, `dechiffrer` dans `app.js`) : contenu compressé (gzip), puis AES-GCM 256, clé tirée du code par PBKDF2-SHA256 (210 000 tours), sel et vecteur nouveaux à chaque écriture. En clair : seulement la date et le type. Les vieux téléphones sans `DecompressionStream` (iOS 15) utilisent `inflateGzip`.

**Prix réguliers des circulaires** : quand une circulaire indique le prix régulier (« rég. 5,99 $ », « économisez 2 $ », un rabais en %), il est gardé (`o`). Pour une épicerie sans relevé (Metro, Super C, Walmart…), ce prix et le spécial remplacent l'estimation (`src: 'circ'`), et, à partir de 8 articles comparables, l'écart de l'épicerie avec Maxi en tient compte (`ecartCirc` : prix régulier de la circulaire ÷ prix de la même sorte de marque chez Maxi et IGA). Dans les circulaires de Flipp, le prix régulier vient surtout du rabais en %.

**Journal public** : le journal des robots (onglet Actions) ne montre ni code postal ni spécial, seulement « Zone 1 : 12 circulaires ».

## Reels et photos du frigo (Gemini de chaque personne)

Chaque personne colle sa propre clé Gemini gratuite (aistudio.google.com) dans Profil → Épiceries. Elle reste sur le téléphone (clé `menu_epicerie_gemini`, hors des sauvegardes). Le téléphone appelle directement `generativelanguage.googleapis.com` (Google accepte les appels venant du site), la clé dans l'en-tête `x-goog-api-key`, jamais dans l'adresse. L'app prend le modèle Gemini Flash le plus récent offert à la clé et passe au suivant s'il atteint sa limite (`gemLire`, `gemChoisir`).

- une recette revient en texte dans le format que lit `parseWebRecipe`, puis ouvre le formulaire « Nouvelle recette » pour être vérifiée;
- un inventaire devient une liste à cocher qui met à jour Maison;
- les consignes (`RB_PROMPTS`) et le nettoyage des réponses (`rbNettoyer`) sont les mêmes que ceux du robot `robot/demandes.mjs` du dépôt privé (plus utilisé par l'app).

## Banque commune de la famille

Tout passe par un **dépôt GitHub privé** (`mdulac86/menu-famille`). **Banque commune** : `recettes-famille.json`. « Ajouter à la banque commune » (ou « Partager avec la famille ») l'y ajoute; chaque téléphone qui a le code de la famille la relit au plus toutes les 6 heures et l'ajoute aux recettes (étiquette « Famille », `fam: true`). « Retirer de la banque commune » l'enlève pour tout le monde.

**La clé du dépôt privé** : un jeton GitHub à accès fin (Contents : lecture et écriture, sur `menu-famille` seulement), gardé dans le secret `MENU_BOITE` du dépôt public. Le workflow « Clé de la boîte » (`robot/boite.mjs`) le chiffre avec le code de la famille dans `boite.enc.json`; le robot des spéciaux le refait chaque semaine si le code a changé. Le jeton n'ouvre que le dépôt privé : même avec le code, personne ne peut modifier l'application.

## Droits d'auteur

© 2026 mdulac86. Tous droits réservés (voir `LICENSE`). Le dépôt est public seulement pour héberger l'application : aucune permission de copier, modifier ou publier ailleurs le code, les recettes, les prix ou les textes. L'avis est aussi au début de `index.html`, `app.js`, `recettes.js`, `style.css` et `sw.js`, et dans l'Aide (« Droits d'auteur »). Garder ces avis à chaque mise à jour.

## Mettre une nouvelle version en ligne

1. Changer la version dans `version.js` en montant seulement le 3ᵉ chiffre : `2.3.0` → `2.3.1` → `2.3.2`…
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

Chaque jeudi à 6 h 17 (heure du Québec), GitHub lance le robot (`robot/releve.mjs`). Pour chaque article du barème, il cherche le produit chez Maxi (l'API PC Express, la même que maxi.ca) et chez IGA (le catalogue Algolia d'iga.ca), pour les magasins de `robot/magasins.json`. Il garde le meilleur prix régulier et la promotion en cours pour chaque format du barème et, à part (`m`, ou `mk` au kilo), le meilleur prix d'une marque connue (pas Sans Nom, le Choix du Président, Compliments…; `1` = le moins cher est déjà une marque connue). Il écrit le tout dans `prix-epiceries.enc.json`, chiffré avec le code de la famille (voir plus haut). Si un site refuse, les prix précédents de ce magasin sont gardés et l'erreur est notée. Walmart bloque les robots : il n'est pas relevé.

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

### Goûts, questionnaire et ébauche

- `profil.membres[i]` : `nom` (facultatif), `g` (note par goût : 5 J'adore, 4 J'aime, 3 Je tolère, 2 Je n'aime pas, 1 Refuse d'en manger; clés dans `GOUTS`), `rx` (autres aliments refusés, séparés par des virgules).
- `famAvis(r)` : qui refuse quoi et la note moyenne. Un plat que tout le monde refuse est écarté (`famBad`); la note pèse dans `score` (`famBonus`); `fill` répartit les coups de cœur entre les membres.
- 2e protéine (`p2Info`) : si seulement certains refusent la protéine principale (`mainProts`), leur part est retirée de cette protéine et remplacée (`P2`) dans la liste et l'écran Cuisiner. `it.p2` : choix manuel (`non` = aucune).
- `menu.q` : réponses du questionnaire de la semaine (`temps` : vite, normale, temps; `mix` : p2, eviter, pareil; `env`, `pas`). `menu.eb` : le menu est une ébauche (étape « ebauche » de Ma semaine) jusqu'à « Bâtir le menu final ».
- Repas plaisir (cheat meal) : `p.nCm` par semaine; `it.cm` = un souper « à l'occasion » (`r.oc`) ou de style pub, placé le vendredi ou le samedi (`repasPlaisir`, `assignDays`), jamais deux soirs de suite. Les poutines (style `poutine`) en font partie. Les recettes `oc` ne sont jamais choisies comme souper ordinaire ni comme entrée; Recettes → Genre « Repas plaisir (soirs de match, poutines) », regroupé par style. `r.nonut` : pas de valeur nutritive par portion (bacon maison).
- Soupes et entrées : `it.sr` = soupe-repas dans les soupers (`p.nSr`), accompagnements de type `soupe`; `it.ro` = rôle d'une soupe (`avec`, `lunch`) ou d'une entrée (`entree`, `avec`, `libre`), avec le jour `d` du souper (`assignExtras`).

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
