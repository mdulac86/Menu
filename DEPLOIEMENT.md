# Menu de la semaine — 2.3.8

Cette livraison remplace la présentation de la version originale 2.3.7. Les 407 recettes et leurs identifiants, les 39 accompagnements, les fonctions de planification, les prix, les préférences, Gemini et les robots GitHub sont conservés.

## Avant la publication

1. Dans l'application actuelle, ouvrir **Profil → Compte → Sauvegarde** et exporter une copie JSON. Conserver ce fichier.
2. Télécharger également une copie du dépôt actuel ou noter son commit pour pouvoir revenir à son code.
3. Tester la livraison localement : `node outils/servir.cjs`, puis ouvrir `http://localhost:8080`. Utiliser une autre origine pour ces essais afin de garder les données de production séparées.
4. Exécuter les vérifications avec Node.js 22 ou plus récent :

```sh
node tests/unit.cjs
node tests/offline.cjs
node tests/assets.cjs
```

## Publier après approbation

Utiliser GitHub Desktop ou Git pour publier tous les fichiers dans un seul commit :

1. Ouvrir une copie locale du dépôt `mdulac86/Menu` dans GitHub Desktop (ou le cloner).
2. Extraire l'archive, puis copier **le contenu du dossier Menu-main** à la racine de cette copie locale, y compris `assets/`, `photos.js`, `design.css` et `.github/workflows/`. Conserver le dossier `.git` existant.
3. Vérifier les changements dans GitHub Desktop : les 407 images doivent être présentes. Créer un seul commit pour toute la livraison.
4. Après approbation, cliquer **Push origin**. GitHub Pages publiera ensuite ce commit.

La publication des images doit accompagner celle du code ; ne pas publier seulement les fichiers JavaScript.

Ne pas supprimer les secrets existants `MENU_CLE`, `MENU_CP` et `MENU_BOITE`. Les fichiers chiffrés et les robots restent en place. Dans GitHub Pages, conserver la branche et le dossier de publication actuels. Aucun serveur applicatif ni compilation ne sont nécessaires.

Après le déploiement, fermer et rouvrir l'application avec Internet. La version 2.3.8 crée une copie « Avant la mise à jour ». Vérifier le menu, les favoris, le garde-manger et les portions avant de poursuivre l'utilisation normale.

## Photos et hors ligne

Les illustrations culinaires sont générées et ne sont pas des photographies des recettes réellement cuisinées. Une image distincte est associée à chaque recette originale par son nom. Les variantes d'une même recette partagent cette illustration. Les nouvelles recettes personnelles restent utilisables sans image.

Les images sont incluses dans `assets/recipes/`, en WebP. Aucune image distante n'est nécessaire. Les images consultées sont conservées sur l'appareil. Dans **Recettes**, « Télécharger les photos hors ligne » prépare toute la bibliothèque ; attendre le message confirmant le nombre total de photos. Si des téléchargements échouent, recommencer : les photos déjà présentes ne sont pas téléchargées de nouveau.

Le navigateur peut supprimer un stockage local lorsque l'appareil manque d'espace. L'export JSON protège les données personnelles ; les photos peuvent être téléchargées de nouveau.

L'application et les images mises en cache fonctionnent hors ligne. Gemini, la banque familiale et l'actualisation des prix demandent Internet. Les polices système prennent le relais sans connexion.

## Retour à la version précédente

Restaurer le commit de code précédent dans GitHub sans effacer les données du navigateur. Pour un retour forcé du service worker, attribuer au code précédent un nouveau numéro de version supérieur avant publication. Conserver les sauvegardes JSON et restaurer seulement si nécessaire depuis Profil → Compte. Ne jamais effacer les données Safari pour effectuer une mise à jour.

## Vérifications externes

Les tests locaux ne prouvent pas qu'un secret GitHub est valide ou que Google et les épiceries accepteront chaque requête future. Après publication autorisée, contrôler une exécution des robots et un appel Gemini avec les clés déjà configurées. Aucun secret n'est inclus dans cette livraison.
