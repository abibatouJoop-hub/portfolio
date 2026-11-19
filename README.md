# Portfolio

Site portfolio personnel avec un **espace d'administration** : le site public présente le profil, les compétences, le parcours et les projets ; l'administratrice gère tout ce contenu et lit les messages reçus via le formulaire de contact.

| Partie | Technologie | Dossier | État |
|---|---|---|---|
| API REST | Laravel 12 · PHP 8.2+ | [`backend/`](backend) | ✅ terminée (étapes 1 à 9) |
| Base de données | PostgreSQL 17 | — | ✅ |
| Authentification | Laravel Sanctum (mode SPA : cookie + CSRF) | — | ✅ |
| Interface | Angular 22 | [`frontend/`](frontend) | 🚧 à venir (étape 10) |

L'architecture complète est décrite dans [`backend/docs/Architecture backend – Portfolio (Laravel · PostgreSQL).pdf`](backend/docs).

---

## Sommaire

- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Endpoints de l'API](#endpoints-de-lapi)
- [Sécurité](#sécurité)
- [Installation](#installation)
- [Tests](#tests)
- [Ce qui a été réalisé](#ce-qui-a-été-réalisé)

---

## Architecture

Une requête traverse les couches dans un seul sens, et chaque couche a **une seule responsabilité** :

```
Angular ──▶ routes/api.php ──▶ middleware (auth:sanctum, throttle)
        ──▶ FormRequest   (validation, 422 si invalide)
        ──▶ Controller    (reçoit, délègue, répond — aucune logique)
        ──▶ Service       (règles métier, transactions, cache, fichiers)
        ──▶ Model         (relations, casts, scopes)
        ──▶ PostgreSQL    (clés étrangères, CHECK, index uniques)
Angular ◀── Resource      (format du JSON renvoyé)
```

| Couche | Dossier | Contient |
|---|---|---|
| Enums | `app/Enums` | Valeurs autorisées : `ProjectStatus`, `ProjectCategory`, `ExperienceType` |
| FormRequest | `app/Http/Requests` | Règles de validation, séparées en `Site/`, `Admin/`, `Auth/` |
| Controllers | `app/Http/Controllers/Api/V1` | `Site/` (public, lecture) · `Admin/` (protégé) · `Auth/` |
| Services | `app/Services` | `ProjectService`, `SkillService`, `ExperienceService`, `ProfileService`, `ContactMessageService`, `TechnologyService`, `MediaService`, `DashboardService` |
| Models | `app/Models` | `Profile`, `SocialLink`, `SkillCategory`, `Skill`, `Project`, `Experience`, `Technology`, `ContactMessage`, `User` |
| Resources | `app/Http/Resources` | Format JSON ; les champs internes ne sont exposés qu'à l'admin |
| Événements | `app/Events`, `app/Listeners`, `app/Mail` | Message de contact reçu → e-mail en file d'attente |

Pas de couche Repository : Eloquent joue déjà ce rôle, et les requêtes réutilisées sont des **scopes** (`Project::published()`, `Skill::visible()`…).

---

## Modèle de données

10 tables métier (en plus de `users`, `sessions`, `cache`, `jobs`) :

| Table | Rôle | Contraintes notables |
|---|---|---|
| `profiles` | Profil unique : accueil, à propos, pied de page | `languages` en `jsonb`, `CHECK` « tableau » |
| `social_links` | GitHub, LinkedIn… | `platform` unique |
| `skill_categories` / `skills` | Compétences groupées par catégorie | `CHECK (level BETWEEN 0 AND 100)`, nom unique par catégorie, suppression en cascade |
| `technologies` | Table partagée (« Laravel », « Angular »…) | `slug` unique |
| `projects` | Réalisations | `slug` unique, suppression douce (soft delete), **index partiel** sur les projets publiés |
| `project_technology` | Pivot projets ↔ technologies | clé primaire composée |
| `experiences` | Parcours : emploi, stage, formation | `CHECK (end_date >= start_date)` |
| `experience_technology` | Pivot expériences ↔ technologies | clé primaire composée |
| `contact_messages` | Messages du formulaire | `ip_address` en type `inet` |

Les statuts et catégories sont stockés en `varchar` et typés par des **enums PHP** : ajouter une valeur ne demande aucune migration.

---

## Endpoints de l'API

Toutes les routes sont préfixées par **`/api/v1`**. Les réponses suivent le format `{ "data": … }` ; les erreurs de validation renvoient `422` avec `{ "message", "errors" }`.

### Site public

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/profile` | Profil et réseaux sociaux |
| GET | `/skills` | Compétences visibles, groupées par catégorie |
| GET | `/experiences` | Parcours, du plus récent au plus ancien |
| GET | `/projects?category=web` | Projets publiés (filtre optionnel : `web`, `api`, `mobile`) |
| GET | `/projects/{slug}` | Détail d'un projet publié |
| POST | `/contact` | Envoi d'un message — **5 par heure et par IP** |

### Authentification

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | Pose le cookie CSRF (hors `/api/v1`, à appeler avant le login) |
| POST | `/auth/login` | Connexion — **5 essais par minute** |
| POST | `/auth/logout` | Déconnexion |
| GET | `/auth/me` | Utilisateur connecté |
| POST | `/auth/forgot-password` | « Mot de passe oublié ? » : envoie un lien par e-mail `{ email }` |
| POST | `/auth/reset-password` | Nouveau mot de passe `{ token, email, password, password_confirmation }` |

Le lien reçu par e-mail ouvre la page Angular `/admin/reset-password?token=…&email=…` (réglable avec `FRONTEND_PASSWORD_RESET_PATH`). Il expire au bout de 60 minutes et ne sert qu'une fois.

### Administration (préfixe `/admin`, connexion obligatoire)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/admin/dashboard` | Compteurs, derniers messages, dernières modifications |
| PUT | `/admin/password` | Changement de mot de passe (mot de passe actuel exigé) |
| CRUD | `/admin/projects` | Projets (brouillons compris) · `?status=draft` |
| PATCH | `/admin/projects/reorder` | Nouvel ordre d'affichage `{ "ids": [3, 1, 2] }` |
| POST · DELETE | `/admin/projects/{id}/cover` | Image de couverture |
| CRUD | `/admin/skill-categories` | Catégories de compétences |
| CRUD | `/admin/skills` | Compétences · `?category={id}` |
| PATCH | `/admin/skills/reorder` | Glisser-déposer |
| CRUD | `/admin/experiences` | Parcours · `?type=work` |
| GET | `/admin/messages?filter=…` | Boîte de réception paginée : `inbox` (défaut), `unread`, `archived`, `all` |
| GET · PATCH · DELETE | `/admin/messages/{id}` | Lecture (marque comme lu) · `{ "read": false }` / `{ "archived": true }` · suppression |
| GET · PUT | `/admin/profile` | Profil et réseaux sociaux |
| POST · DELETE | `/admin/profile/photo` · `/admin/profile/cv` | Photo de profil · CV (PDF) |

Les fichiers s'envoient en `FormData`, dans le champ **`file`**.

---

## Sécurité

- **Un seul compte admin**, sans route d'inscription : il est créé par `AdminUserSeeder` à partir de `ADMIN_EMAIL` et `ADMIN_PASSWORD` du `.env` (jamais versionné).
- **Sanctum en mode SPA** : la session est portée par un cookie `HttpOnly`, avec un jeton CSRF. Aucun jeton n'est stocké dans le navigateur.
- **CORS** limité à l'origine Angular (`FRONTEND_URL`), avec `supports_credentials`.
- **Limites de débit** : connexion (5/min par email + IP), mot de passe oublié (3/min et 10/h par IP), contact (5/h par IP) → `429`.
- **Mot de passe oublié** : même réponse que l'adresse existe ou non (on ne peut pas deviner l'email admin), jeton haché à usage unique, et toutes les sessions ouvertes sont déconnectées après la réinitialisation.
- **Mot de passe** : 12 caractères minimum, avec majuscules, minuscules et chiffres.
- **Formulaire de contact** : champ piège `website` contre les robots, adresse IP enregistrée, contenu échappé dans l'e-mail.
- **Fichiers** : nom aléatoire, type et taille vérifiés (images jpg/png/webp ≤ 2 Mo, SVG refusé ; CV en PDF ≤ 5 Mo), ancien fichier supprimé au remplacement.
- **Toutes les routes `/admin`** sont couvertes par un test qui vérifie qu'un invité reçoit `401`, y compris les routes ajoutées plus tard.
- **Mode strict Eloquent** hors production : les requêtes N+1 et les attributs non autorisés lèvent une erreur.

---

## Installation

### Prérequis

- PHP **8.2 ou plus** (extensions `pdo_pgsql`, `gd`, `fileinfo`)
- Composer
- PostgreSQL
- Node.js (pour le front)

> Sous Laragon, vérifiez que la version de PHP active est bien ≥ 8.2 (menu **PHP → Version**) : avec PHP 8.1, `php artisan` refuse de démarrer.

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Créez les bases PostgreSQL `portfolio` et `portfolio_test`, puis complétez `.env` :

```dotenv
DB_CONNECTION=pgsql
DB_DATABASE=portfolio
DB_USERNAME=postgres
DB_PASSWORD=...

ADMIN_NAME="Votre nom"
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

```bash
php artisan migrate --seed   # tables + compte admin + profil (+ données de démo en local)
php artisan storage:link     # rend les fichiers envoyés accessibles via /storage
php artisan serve            # API sur http://localhost:8000
php artisan queue:work       # dans un autre terminal : envoie les e-mails en attente
```

En local, `MAIL_MAILER=log` : les e-mails sont écrits dans `storage/logs/laravel.log` au lieu d'être envoyés.

Pour repartir de zéro : `php artisan migrate:fresh --seed`.

### Frontend

À venir (étape 10) : proxy de développement vers `/api` et `/sanctum`, intercepteur HTTP, garde de route sur `/admin`.

---

## Tests

```bash
cd backend
php artisan test
```

**111 tests** (422 vérifications), exécutés sur une vraie base PostgreSQL (`portfolio_test`), pour que les contraintes `CHECK`, `jsonb` et `inet` soient testées comme en production.

| Dossier | Contenu |
|---|---|
| `tests/Feature/Site/` | Site public : seuls les contenus publiés et visibles apparaissent |
| `tests/Feature/Admin/` | CRUD, validation (`422`), invités refusés (`401`), fichiers, tableau de bord |
| `tests/Feature/` | Authentification, limites de débit, CORS/CSRF, contraintes de la base, seeders |
| `tests/Unit/Services/` | Slug unique, date de publication, technologies, cache, fichiers |
| `tests/Unit/Models/` | Casts, relations, scopes |

Formatage du code : `vendor/bin/pint`.

---

## Ce qui a été réalisé

Le backend suit les étapes de mise en place du document d'architecture :

1. **PostgreSQL** — bases `portfolio` et `portfolio_test`, tests sur PostgreSQL au lieu de SQLite.
2. **API et Sanctum** — `routes/api.php`, mode SPA (`statefulApi()`), CORS, erreurs toujours en JSON sous `/api`.
3. **Enums et migrations** — 3 enums, 10 tables avec contraintes PostgreSQL.
4. **Models et factories** — casts, relations, scopes, mode strict, factories avec états (`draft()`, `current()`, `archived()`…).
5. **Seeders** — compte admin depuis `.env`, profil pré-rempli, contenu de démonstration en local (relançables sans doublon).
6. **Ressources** — projets, compétences, expériences, profil, messages : FormRequest → Service → Controller → Resource → route → tests, avec mise en cache du site public.
7. **Authentification** — login, logout, me, limites de débit, changement de mot de passe, « mot de passe oublié ? », tableau de bord.
8. **Fichiers** — `MediaService`, `storage:link`, couverture de projet, photo et CV.
9. **Contact** — route publique, champ piège, événement `ContactMessageReceived` et e-mail en file d'attente.
10. **Angular** — 🚧 prochaine étape.
