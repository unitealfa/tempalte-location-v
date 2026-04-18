# location-de-voiture-lea

Architecture:
- un seul serveur Node.js
- une seule URL locale pour le front et l'API
- React cote client
- Express cote serveur
- MySQL distant avec SSL pour les admins
- base cible utilisee: `location-de-v`
- session admin securisee par cookie `HttpOnly`

Prerequis:

```text
Node.js 18+ conseille
npm
Le fichier dbinfo.txt a la racine
Le fichier .env a la racine pour la configuration mail
Acces reseau sortant vers la base MySQL distante
Acces reseau sortant vers SMTP Gmail
```

Installation de toutes les dependances:

```bash
npm install
```

Configuration mail:

```text
Un exemple est fourni dans .env.example
Le projet charge automatiquement .env au demarrage du serveur
```

Lancement en developpement:

```bash
npm install
npm run dev
```

Puis ouvrir:

```text
http://localhost:4000
```

Connexion admin de dev creee automatiquement au demarrage:

```text
username: lea
email: lea@gmail.com
mot de passe initial: 123
```

Initialisation automatique au demarrage:

```text
- lecture des identifiants de dbinfo.txt
- utilisation de la base `location-de-v` au lieu de `defaultdb`
- creation de la base `location-de-v` si absente
- connexion MySQL avec SSL
- creation de la table admin_users si absente
- creation de la table admin_sessions si absente
- creation de la table admin_verification_requests si absente
- creation de la table vehicles si absente
- creation de l'admin lea seulement s'il n'existe pas deja
- si MySQL est temporairement indisponible, le serveur reste vivant et retente automatiquement
```

Build de production:

```bash
npm run build
npm run start
```

Deploiement Vercel:

```text
- le front est servi depuis client/dist
- l'API Express est exposee via api/index.js en fonction Node Vercel
- les variables DB doivent etre renseignees dans Vercel :
  DB_HOST
  DB_PORT
  DB_USER
  DB_PASSWORD
  DB_NAME
  DB_SSL_CA si necessaire
  SESSION_SECRET
  MAIL_SMTP_HOST
  MAIL_SMTP_PORT
  MAIL_SMTP_SECURE
  MAIL_SMTP_USER
  MAIL_SMTP_PASS
  MAIL_FROM
  RESERVATION_FILE_ENCRYPTION_KEY
```

Important pour Vercel:

```text
- les ecritures locales dans /server/uploads et /server/secure-storage ne sont pas un stockage persistant sur Vercel
- le site peut etre deploye, mais pour une production fiable des uploads il faut ensuite migrer les fichiers vers un stockage externe type S3 / Cloudinary / Vercel Blob
- la configuration Vercel est fournie dans vercel.json
```

API utile:

```text
GET  /api/health
GET  /api/content/home
POST /api/admin/login
GET  /api/admin/session
POST /api/admin/logout
GET  /api/admin/protected/me
GET  /api/admin/protected/dashboard
GET  /api/admin/profile
POST /api/admin/profile/update/request
POST /api/admin/profile/update/confirm
POST /api/admin/profile/update/resend
POST /api/admin/profile/password/request
POST /api/admin/profile/password/confirm
POST /api/admin/profile/password/resend
GET  /api/vehicles
GET  /api/vehicles/:id
GET  /api/admin/vehicles
POST /api/admin/vehicles
GET  /api/admin/vehicles/:id
PUT  /api/admin/vehicles/:id
DELETE /api/admin/vehicles/:id
POST /api/admin/vehicles/:id/maintenance
POST /api/admin/vehicles/:id/available
POST /api/vehicles/:id/reservations
GET  /api/admin/reservations
GET  /api/admin/reservations/:id
```

Verification email admin:

```text
- le code de verification expire en 60 secondes
- le bouton de renvoi doit attendre l'expiration avant de se reactiver
- les changements sensibles du profile admin passent par un code envoye par email
```

Gestion des vehicules:

```text
- la page /location-de-voitures affiche les vehicules disponibles au public
- l'admin voit aussi les vehicules en maintenance
- l'admin peut creer, modifier, supprimer et passer un vehicule en maintenance
- un vehicule en maintenance est masque pour les visiteurs
- les photos et la video du vehicule passent par upload de fichiers
- les medias uploades sont servis depuis /uploads
- les images uploades sont compressees automatiquement et une miniature est generee pour accelerer le catalogue
- la boite de vitesse est limitee a Automatique ou Manuelle
- le carburant est limite a Essence, Diesel ou GPL
- une fiche vehicule permet maintenant la reservation via formulaire ou via WhatsApp
- les demandes de reservation sont visibles par l'admin dans la page Commencer
- le permis de conduire est uploadé en image et stocke localement dans /uploads/reservations
```
codex resume 019d0d15-b77f-7303-b8f4-10a809e42bcf
