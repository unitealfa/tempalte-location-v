# Notes Projet

Ce fichier centralise les consignes produit et techniques a conserver pour le projet.
Il doit servir de reference pour les prochaines evolutions.

## Consignes deja definies

- Utiliser `Node.js` pour le back.
- Utiliser `React` pour le front.
- Avoir une architecture claire avec composants separes pour le front.
- Garder une page d'accueil avec:
  - un `Header`
  - une page `Aceulle`
  - un `Footer`
- Le `Header` doit contenir:
  - un bouton menu hamburger a gauche
  - un logo a droite
  - un popup au clic sur le menu
  - l'action `Se connecter` dans le popup
- Quand on clique sur `Se connecter`, il faut ouvrir une page de login admin.
- La page de login admin doit contenir un formulaire.
- Si l'admin se connecte avec succes, sa connexion doit rester active sans expiration.
- La connexion admin ne doit disparaitre que lors d'une deconnexion explicite.
- Il faut ajouter un bouton `Se deconnecter`.
- Lors de la deconnexion, il faut supprimer les traces locales de connexion dans le navigateur.
- La session admin doit etre securisee cote serveur avec cookie `HttpOnly`.
- Le front ne doit pas stocker le token de connexion en clair dans `localStorage` ou `sessionStorage`.
- Les futures routes admin doivent etre protegees par middleware serveur.
- L'URL `/admin` doit etre bloquee cote serveur si aucune session admin valide n'existe.
- Il faut ajouter un acces `Profile` dans le header admin.
- Depuis `Profile`, l'admin doit pouvoir modifier:
  - le nom d'utilisateur
  - l'email
  - le mot de passe
- Pour changer le mot de passe:
  - demander le mot de passe actuelle
  - demander le nouveau mot de passe
  - si le mot de passe actuelle est correct, envoyer un code par email
  - afficher une popup pour saisir le code
- Le code email doit expirer en `60 secondes`.
- Le bouton `Renvoyer` doit rester grise tant que le code n'a pas expire.
- Le mail affiche dans la popup doit etre masque avec des `*`.
- L'envoi des codes de verification passe par le compte mail configure dans `.env`.
- Le centre de la page doit afficher un texte du type `Liste des voitures et tout`.
- La page `LOCATION DE VOITURES` doit afficher les vehicules reellement enregistres.
- Si aucun vehicule n'est disponible pour le public, afficher `Aucun vehicule disponible`.
- L'admin doit voir un bouton `+` dans `LOCATION DE VOITURES` pour creer un vehicule.
- Lors de la creation d'un vehicule, stocker en base:
  - marque
  - modele
  - version
  - carburant
  - boite de vitesse
  - nombre de places
  - cabriolet
  - puissance
  - prix journalier
  - prix hebdomadaire
  - prix mensuel
  - depot de garantie
  - kilometrage autorise par jour
  - prix des kilometres supplementaires
  - video facultative
  - photos
- A la creation, un vehicule doit etre `disponible` par defaut.
- En modification, l'admin doit pouvoir changer la disponibilite.
- `Boite de vitesse` doit etre un select `Automatique` ou `Manuelle`.
- `Carburant` doit etre un select `Essence`, `Diesel` ou `GPL`.
- Les photos et videos vehicule doivent passer par selection de fichiers et etre affichees en apercu.
- `Description du prix` est un texte global du site et non plus un champ du vehicule.
- `Conditions de location` est un texte global du site et non plus un champ du vehicule.
- Le catalogue ne doit pas afficher de blocs inutiles qui ralentissent ou alourdissent la lecture.
- `Description du prix` et `Conditions de location` doivent rester visibles dans la page detail d'un vehicule, mais pas dans le catalogue.
- Depuis la fiche detail d'un vehicule, ajouter:
  - `Reserver via le formulaire`
  - `Discutez via WhatsApp`
- Le bouton formulaire doit faire descendre vers un formulaire de reservation plus bas dans la page.
- Le formulaire de reservation doit demander:
  - nom
  - prenom
  - photo du permis de conduire
  - email facultatif
  - numero de telephone
  - commentaire
  - lieu de recuperation
  - lieu de retour
  - date et heure de recuperation
  - date et heure de retour
- Le formulaire doit imposer une case `politique de confidentialite` pour valider.
- La reservation doit etre enregistree en base de donnees.
- L'admin doit voir les demandes de reservation dans la page `Commencer`.
- Chaque reservation admin doit afficher au moins:
  - la photo du vehicule
  - la duree calculee entre recuperation et retour
- Un clic admin sur une reservation doit ouvrir une page detail avec toutes les informations et la photo du permis.
- Le bouton WhatsApp doit ouvrir une conversation vers `0779107446`.
- Les images vehicule doivent etre compressees automatiquement a l'upload et servir une miniature pour la liste.
- Depuis la fiche d'un vehicule, l'admin doit pouvoir:
  - modifier
  - supprimer
  - masquer pour les autres utilisateurs
- Le masquage public d'un vehicule doit le passer en etat `maintenance`.
- Le `Footer` doit afficher:
  - un numero de telephone
  - la localisation `Algerie`
  - le nom `Lea Location`
- Tous les textes doivent etre prepares pour etre modifies plus tard depuis une interface admin.
- Le projet doit tourner sur un seul `localhost`.
- Il faut une connexion a une base de donnees pour gerer le compte admin.
- La base a utiliser est `location-de-v`, pas `defaultdb`.
- Il faut creer les tables necessaires.
- Il faut creer un admin avec:
  - username `lea`
  - email `lea@gmail.com`
  - mot de passe initial `123`
- Cet admin par defaut doit etre cree seulement s'il n'existe pas deja.
- Il ne faut pas reinitialiser automatiquement son mot de passe a chaque redemarrage.
- Le mot de passe doit etre hache avec `bcrypt`.
- Il ne faut pas imposer de restrictions inutiles sur le mail, le nom d'utilisateur ou le mot de passe.

## Architecture actuelle

- La racine contient des `npm workspaces`.
- Le front est dans [client/](./client).
- Le back est dans [server/](./server).
- Le serveur principal est [server/src/index.js](./server/src/index.js).
- Le front React principal est [client/src/App.jsx](./client/src/App.jsx).
- Les composants front sont separes:
  - [client/src/components/Header.jsx](./client/src/components/Header.jsx)
  - [client/src/pages/Aceulle.jsx](./client/src/pages/Aceulle.jsx)
  - [client/src/components/Footer.jsx](./client/src/components/Footer.jsx)
  - [client/src/pages/LocationVehiclesPage.jsx](./client/src/pages/LocationVehiclesPage.jsx)
  - [client/src/pages/VehicleDetailPage.jsx](./client/src/pages/VehicleDetailPage.jsx)
  - [client/src/pages/AdminVehicleFormPage.jsx](./client/src/pages/AdminVehicleFormPage.jsx)
- Le style global est dans [client/src/styles/global.css](./client/src/styles/global.css).
- Toute page ou section reprise depuis le dossier local `rentzoexclusive.com` doit etre reproduite au plus pres du mockup source: tailles, marges, placements, dimensions des images et typographies.
- Les textes centralises sont dans [server/src/config/defaultContent.js](./server/src/config/defaultContent.js).
- Le service de contenu back est dans [server/src/services/contentService.js](./server/src/services/contentService.js).
- Les routes API sont dans [server/src/routes/contentRoutes.js](./server/src/routes/contentRoutes.js).
- Le front charge le contenu via [client/src/services/contentService.js](./client/src/services/contentService.js).
- Les vehicules publics passent par [server/src/routes/vehicleRoutes.js](./server/src/routes/vehicleRoutes.js).
- Les actions admin vehicules passent par [server/src/routes/adminVehicleRoutes.js](./server/src/routes/adminVehicleRoutes.js).
- La logique metier vehicule est dans [server/src/services/vehicleService.js](./server/src/services/vehicleService.js).
- Les acces SQL vehicule sont dans [server/src/repositories/vehicleRepository.js](./server/src/repositories/vehicleRepository.js).

## Regle critique de performance

Le client cible peut avoir une connexion internet d'environ `30 kb/s`.
La performance front doit donc etre consideree comme une contrainte prioritaire permanente.

## Regles d'optimisation a respecter en permanence

- Toujours privilegier la solution la plus legere cote front.
- Reduire au maximum la taille du JavaScript envoye au navigateur.
- Eviter les bibliotheques lourdes si du code natif ou simple suffit.
- Limiter le nombre de requetes HTTP.
- Garder les reponses API courtes et ciblees.
- Eviter les images lourdes, les videos automatiques et les assets inutiles.
- Eviter les polices distantes si elles ne sont pas indispensables.
- Charger tres vite le contenu visible immediatement.
- Faire passer la lisibilite et la vitesse avant les effets visuels non essentiels.
- Verifier l'impact performance avant tout ajout de composant, page ou dependance.
- Si une fonctionnalite ajoute du poids, chercher d'abord une alternative plus legere.
- Conserver une interface rapide meme sur reseau tres lent.

## Ligne de conduite pour les prochaines evolutions

- Tout nouveau texte doit pouvoir etre rendu editable plus tard par l'admin.
- Toute nouvelle page doit rester compatible avec une architecture simple, separee et maintenable.
- Toute decision technique doit prendre en compte en premier:
  - la vitesse d'affichage
  - la simplicite du code
  - le faible poids reseau
- Le serveur ne doit pas tomber completement sur une panne reseau transitoire de la base.
- En dev, les modifications doivent se recharger automatiquement sans relance manuelle du process.
