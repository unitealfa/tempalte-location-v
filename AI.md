# CODEX.md

Ce fichier sert de vue d'ensemble du projet pour comprendre rapidement le site sans devoir relire tout le code source.

## 1. But du projet

Application de location de voitures avec :

- front public React/Vite
- back Node.js/Express
- base MySQL
- interface admin
- contenu visuel partiellement modifiable par l'admin
- inspiration visuelle fortement calée sur `rentzoexclusive.com`

Le site couvre :

- accueil
- catalogue véhicules
- fiche véhicule
- réservation client
- FAQ
- contact
- login admin
- dashboard admin
- gestion véhicules
- gestion réservations
- page admin `/admin/visuelle`

## 2. Arborescence utile

- `client/src/pages`
  Contient les pages React principales.

- `client/src/components`
  Contient les composants UI réutilisables.

- `client/src/services`
  Appels API côté front + cache local.

- `client/src/styles/global.css`
  Grosse feuille de style principale du projet.

- `server/src/routes`
  Routes Express.

- `server/src/services`
  Logique métier.

- `server/src/repositories`
  Accès DB.

- `server/src/config/defaultContent.js`
  Structure par défaut du contenu du site.

- `server/src/db/schema.js`
  Création/évolution de tables.

- `server/data`
  Persistance serveur non source si nécessaire.

- `server/uploads`
  Médias publics du site.

- `server/secure-storage`
  Fichiers sensibles chiffrés, non exposés publiquement.

## 3. Stack technique

- Front : React + Vite
- Back : Express
- DB : MySQL
- Uploads : Multer
- Images : Sharp
- Mail : Nodemailer
- Session/auth admin : cookie session

## 4. Pages front importantes

### Public

- `client/src/pages/Aceulle.jsx`
  Page d'accueil premium type Rentzo.

- `client/src/pages/LocationVehiclesPage.jsx`
  Catalogue des véhicules avec filtres, compare et accès fiche.

- `client/src/pages/VehicleDetailPage.jsx`
  Fiche véhicule détaillée avec galerie, prix, conditions, réservation, véhicules apparentés.

- `client/src/pages/FaqPage.jsx`
  FAQ stylée type Rentzo.

- `client/src/pages/ContactPage.jsx`
  Hero contact, infos, horaires, map.

### Admin

- `client/src/pages/AdminLogin.jsx`
  Connexion admin.

- `client/src/pages/AdminAceulle.jsx`
  Dashboard admin.

- `client/src/pages/AdminVehicleFormPage.jsx`
  Création/modification véhicule.

- `client/src/pages/AdminReservationFormPage.jsx`
  Création/modification réservation admin.

- `client/src/pages/ClientsCalendarPage.jsx`
  Vue admin des réservations et demandes.

- `client/src/pages/ReservationDetailPage.jsx`
  Détail d'une réservation admin.

- `client/src/pages/AdminVisualPage.jsx`
  Page de modification visuelle du site.

## 5. Composants centraux

- `client/src/components/Header.jsx`
  Header principal du site.

- `client/src/components/Footer.jsx`
  Footer principal du site.

- `client/src/components/VehicleReservationForm.jsx`
  Formulaire de réservation côté client.

- `client/src/components/VehicleVideo.jsx`
  Bloc vidéo véhicule.

- `client/src/components/CompareDrawer.jsx`
  Compare véhicules.

## 6. Comment le contenu du site est géré

Le site utilise 2 niveaux :

### A. `defaultContent.js`

Décrit la structure par défaut du contenu.

Il sert de base/fallback.

### B. `site_settings` en base

Les éléments modifiables par l'admin doivent vivre en base, pas codés en dur.

Le service clé est :

- `server/src/services/contentService.js`

Il :

- charge le contenu final
- fusionne base + fallback
- persiste les réglages admin
- alimente `/admin/visuelle`

## 7. `/admin/visuelle`

La page admin visuelle permet de modifier certains contenus sans toucher au code.

Exemples déjà branchés :

- favicon
- titre de l'onglet navigateur
- logo header
- logo footer
- footer text/contact/social
- hero accueil
- texte accueil
- bloc hôtel de voitures
- avis clients
- sélection des véhicules de la section cabriolets
- FAQ
- contact

Important :

- les previews de `/admin/visuelle` sont des mini-rendus
- certains blocs utilisent le vrai markup du site réduit
- d'autres utilisent une reconstitution visuelle volontairement stable

## 8. Routes backend importantes

### Publiques

- contenu du site
- véhicules publics
- détail véhicule
- réservation client

### Admin

- auth admin
- dashboard admin
- CRUD véhicules
- CRUD réservations
- visual settings
- upload images branding/visuelles

Voir surtout :

- `server/src/routes/index.js`
- `server/src/routes/adminProtectedRoutes.js`
- `server/src/routes/adminVehicleRoutes.js`
- `server/src/routes/adminReservationRoutes.js`
- `server/src/routes/vehicleRoutes.js`
- `server/src/routes/contentRoutes.js`

## 9. Données véhicule

Un véhicule contient notamment :

- marque
- modèle
- version
- puissance
- transmission
- carburant
- places
- prix journalier / hebdomadaire / mensuel
- dépôt de garantie
- kilométrage autorisé
- photos
- vidéo
- gammes (`Luxe`, `SUV`, etc.)

La logique serveur est surtout dans :

- `server/src/services/vehicleService.js`
- `server/src/repositories/vehicleRepository.js`

## 10. Données réservation

Une réservation contient notamment :

- véhicule
- client
- dates
- statut
- prix total
- override manuel admin éventuel
- permis de conduire côté client/admin

La logique clé est dans :

- `server/src/services/reservationService.js`
- `server/src/repositories/reservationRepository.js`
- `server/src/utils/reservationPricing.js`

## 11. Permis de conduire : sécurité

Les images de permis ne sont pas stockées avec les médias publics.

Elles sont :

- stockées dans `server/secure-storage`
- chiffrées
- servies uniquement via route admin protégée
- invisibles publiquement
- supprimées automatiquement après la logique métier prévue

Fichiers importants :

- `server/src/middleware/reservationUploadMiddleware.js`
- `server/src/services/reservationService.js`

## 12. Uploads d'images du site

### Médias publics

Les images/logo du site passent par des routes admin d'upload, puis sont stockées sous forme de chemins publics.

### Médias sensibles

Les permis restent en stockage privé chiffré.

## 13. Cache et performance

Le projet a reçu plusieurs couches de cache pour limiter les loaders visibles :

- cache côté serveur pour certaines réponses
- cache côté front pour contenu, véhicules, dashboard, réservations
- préchargement de certaines données

Fichiers importants :

- `server/src/services/responseCacheService.js`
- services front dans `client/src/services`

## 14. Style visuel

Le projet vise un rendu très proche de `rentzoexclusive.com`.

Le fichier principal est :

- `client/src/styles/global.css`

Attention :

- ce fichier est gros
- beaucoup d'overrides s'y cumulent
- quand un rendu casse, vérifier les collisions CSS avant tout

## 15. Conventions utiles pour modifier le projet

- Les textes modifiables par l'admin ne doivent pas rester codés en dur si la zone passe par `/admin/visuelle`.
- Si un élément devient modifiable par l'admin :
  - le stockage doit aller en BDD via `site_settings`
  - le rendu du site doit lire cette valeur via `contentService`
  - la preview `/admin/visuelle` doit refléter cette donnée

- Les fichiers sensibles ne doivent jamais passer par `server/uploads`.
- Les médias publics peuvent y aller.

- Quand une section du site doit ressembler à Rentzo :
  - privilégier le vrai markup/classes du rendu réel
  - éviter les approximations visuelles si l'utilisateur demande du quasi-identique

## 16. Fichiers à ouvrir en priorité pour comprendre vite

Si on ne doit lire que quelques fichiers :

1. `client/src/App.jsx`
2. `server/src/services/contentService.js`
3. `server/src/config/defaultContent.js`
4. `client/src/pages/Aceulle.jsx`
5. `client/src/components/Header.jsx`
6. `client/src/components/Footer.jsx`
7. `client/src/pages/VehicleDetailPage.jsx`
8. `client/src/pages/AdminVisualPage.jsx`
9. `server/src/services/vehicleService.js`
10. `server/src/services/reservationService.js`

## 17. Commandes utiles

- build front :
  - `npm run build`

- vérification syntaxe Node :
  - `node --check <fichier>`

- lancer en dev :
  - `npm run dev`

## 18. Résumé ultra-court

Le site est un front React + back Express/MySQL avec :

- contenu dynamique fusionné via `contentService`
- admin métier pour véhicules/réservations
- admin visuel pour modifier certaines zones du site
- rendu premium inspiré de Rentzo
- gestion séparée entre médias publics et documents sensibles
