# Validation de la refonte — 25 octobre 2026

Base utilisée : **Menu-main.zip original, version 2.3.7**. Version préparée : **2.3.8**. Aucune modification n'a été envoyée au dépôt de production ou au site publié.

## Contrôles automatisés

Les scripts livrés vérifient la migration des données existantes, les favoris, les recettes personnelles, les portions, les sauvegardes quotidiennes et avant mise à jour, la rotation des copies, la récupération de données corrompues et le refus d'une restauration invalide.

Ils couvrent aussi les 407 fiches et écrans Cuisiner, les faux rapprochements de spéciaux et 30 générations de semaine avec des budgets, stocks et préférences variés. Les prix et les quantités calculés doivent rester finis et non négatifs.

Le service worker est testé avec un réseau et des caches simulés : installation du code complet, isolation du canal test, rotation des caches, ouverture sans réseau, téléchargement des images, refus des URL externes, échecs correctement signalés et promotions accessibles depuis la copie locale.

## Contrôles dans le navigateur

Configuration de la famille, préparation d'une ébauche, création du menu final et de la liste d'épicerie, navigation du profil, présence des réglages Gemini et sauvegardes, ouverture d'une fiche, mode Cuisiner avec case à cocher, thèmes clair et sombre.

Les vues à 390 px et 1024 px ont été inspectées dans Chromium. Aucune largeur de contenu supérieure au cadre dans les vues contrôlées. Le canal `/test/` ouvre ses propres données et affiche le bandeau TEST.

Ces contrôles ne remplacent pas un essai sur un iPhone physique avec Safari.

## Robots existants : vérification en lecture seule

Les dernières exécutions observées sont réussies :

| Robot | Exécution existante | État |
|---|---|---|
| Prix | [22 octobre 2026](https://github.com/mdulac86/Menu/actions/runs/39803198165) | Réussie |
| Spéciaux | [22 octobre 2026](https://github.com/mdulac86/Menu/actions/runs/39807025320) | Réussie |
| Clé de la boîte | [24 octobre 2026](https://github.com/mdulac86/Menu/actions/runs/40093004415) | Réussie |

Ces résultats concernent le dépôt existant. Aucun robot n'a été relancé et aucun secret n'a été lu ou modifié. Les scripts et workflows d'origine sont conservés dans la livraison.

## Limites des vérifications externes

Aucun appel Gemini réel n'a été effectué : aucune clé personnelle n'a été fournie. La connexion à la banque familiale chiffrée et le déchiffrement avec le code familial n'ont pas été exécutés. Les interfaces et leur code sont conservés. Les données de test ne sont pas incluses dans la livraison.

## Limite de l’aperçu PWA

L’aperçu interne du navigateur est servi en HTTP : le navigateur y désactive les service workers. Le message indiquant que le téléchargement hors ligne demande HTTPS a été vérifié. L’installation PWA et le téléchargement réel des 407 photos doivent donc être confirmés sur l’adresse HTTPS après publication autorisée, ou sur `localhost` avec le serveur local livré. La logique du cache et du téléchargement complet a passé les tests automatisés décrits ci-dessus ; un téléchargement navigateur en HTTPS n’a pas été présenté comme testé.

## Livraison vérifiée

Les 407 illustrations WebP sont incluses et distinctes. Poids cumulé : 41.7 Mo. Les contrôles automatisés ont réussi ; leur sortie est conservée dans `verification.log`.

Comparaison binaire avec le ZIP original : 23 fichiers conservés à l'identique, dont les recettes, les accompagnements, les prix de référence, les données chiffrées, les scripts des robots et leurs workflows.

Les images sont générées avec ImageGen. Leur provenance, dimensions, poids et empreintes figurent dans `PHOTOS.json`.
