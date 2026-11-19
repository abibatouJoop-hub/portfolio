# Portfolio — Frontend (Angular 22)

Site public et espace d'administration, branchés sur l'API Laravel de [`../backend`](../backend).

## Lancer en local

```bash
# 1. API (PHP 8.2 minimum)
cd backend && php artisan serve        # http://localhost:8000

# 2. Front
cd frontend && npm start               # http://localhost:4200
```

`ng serve` utilise [`proxy.conf.json`](proxy.conf.json) : `/api`, `/sanctum` et `/storage` sont redirigés vers `http://localhost:8000`.
Le front doit tourner sur **localhost:4200** (valeur de `SANCTUM_STATEFUL_DOMAINS` et `FRONTEND_URL` dans `backend/.env`), sinon la connexion à l'admin échoue.

## Organisation

```
src/app/
├── core/
│   ├── api/        # un service par ressource de l'API (profile, projects, skills, experiences, messages, dashboard) + types
│   ├── auth/       # AuthService (Sanctum SPA : cookie CSRF → login, me, logout) et gardes de route
│   ├── http/       # intercepteur (Accept JSON, withCredentials, 419 → nouveau jeton, 401 → connexion) et erreurs 422
│   └── ui/         # thème clair/sombre, notifications
├── shared/         # icônes, pipes de dates, saisie de technologies, envoi de fichier, texte enrichi
├── site/           # site public : accueil (hero, à propos, compétences, parcours, projets, contact) et /projets/:slug
├── admin/          # chargé à la demande, protégé par authGuard
└── not-found/
src/styles/         # charte (tokens clair/sombre), composants, site, admin
```

## Routes

| URL | Page |
|---|---|
| `/` | Accueil (une seule page, ancres `#a-propos`, `#competences`, `#parcours`, `#projets`, `#contact`) |
| `/projets/:slug` | Détail d'un projet publié |
| `/admin/connexion` | Connexion |
| `/admin/tableau-de-bord`, `/projets`, `/competences`, `/experiences`, `/messages`, `/profil`, `/a-propos` | Administration |

## Points techniques

- **Aucun jeton dans le navigateur** : la session est un cookie HttpOnly. Les URL sont relatives pour que l'intercepteur XSRF d'Angular ajoute `X-XSRF-TOKEN`.
- **Rendu côté client** (`RenderMode.Client`) : le contenu vient de l'API, indisponible au moment du build.
- **Formulaire de contact** : champ piège `website` caché, erreurs 422 affichées champ par champ, 429 géré.
- **Texte « À propos »** : `**gras**`, `*italique*`, `[lien](https://…)`, échappé avant mise en forme.

## Commandes

```bash
npm start       # serveur de développement
npm run build   # build de production (dist/frontend)
```
