/* Version unique de l'application : la changer à chaque mise en ligne.
   Elle sert à la fois à l'app (copie de sécurité avant mise à jour) et au service worker (cache hors ligne). */
self.APP_VERSION = '2.3.3';
/* Canal : la page test.html (qui pose APP_TEST = true) ou une copie dans un dossier « test » est la version d'essai.
   Elle garde ses données à part (autres clés de stockage, autre cache) : elle ne touche jamais aux vraies données. */
self.APP_TEST = self.APP_TEST === true || /\/test\//.test(self.location.pathname);
/* Adresse courriel pour « Signaler un problème ou une idée » (vide = bouton caché). */
self.APP_CONTACT = '';
