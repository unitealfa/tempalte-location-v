# Dependances du projet

## Prerequis systeme
- Node.js 18 ou plus recent
- npm 9 ou plus recent
- Une base MySQL accessible pour le projet
- Un compte SMTP pour l'envoi des e-mails admin

## Structure technique
- Frontend: React + Vite
- Backend: Node.js + Express
- Base de donnees: MySQL (`location-de-v`)
- Upload image: Multer + Sharp
- Hachage mot de passe: bcrypt
- E-mail: Nodemailer

## Dependances npm installees
### Racine
- workspaces npm: `client`, `server`

### Client
- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`

### Server
- `bcrypt`
- `cors`
- `dotenv`
- `express`
- `multer`
- `mysql2`
- `nodemailer`
- `sharp`
- `nodemon`

## Fichiers obligatoires
- `.env`
- `dbinfo.txt`

## Variables d'environnement utilisees
Dans `.env`:

- `MAIL_SMTP_HOST`
- `MAIL_SMTP_PORT`
- `MAIL_SMTP_SECURE`
- `MAIL_SMTP_USER`
- `MAIL_SMTP_PASS`
- `MAIL_FROM`
- `RESERVATION_FILE_ENCRYPTION_KEY`

## Base de donnees
Le projet lit la connexion depuis `dbinfo.txt`.
La base cible attendue est `location-de-v`.

## Installation
Depuis la racine du projet:

```bash
npm install
```

## Lancement en developpement
Depuis la racine du projet:

```bash
npm run dev
```

Le site sera accessible sur:

```text
http://localhost:4000
```

## Build frontend
```bash
npm run build
```

## Lancement production
```bash
npm run start
```

## Notes importantes
- Les photos de permis sont stockees hors des uploads publics
- Les photos de permis sont chiffreess via `RESERVATION_FILE_ENCRYPTION_KEY`
- Les permis ne sont consultables que via une route admin protegee
- Si `dbinfo.txt` ou `.env` est incomplet, le projet ne fonctionnera pas correctement
