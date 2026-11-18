# Backend — API du portfolio

API REST **Laravel 12 · PostgreSQL · Sanctum** du portfolio.

La documentation complète (architecture, endpoints, installation, tests) se trouve dans le [README à la racine du dépôt](../README.md), et l'architecture détaillée dans [`docs/`](docs).

## Démarrage rapide

```bash
composer install
cp .env.example .env          # puis renseigner DB_*, ADMIN_EMAIL, ADMIN_PASSWORD
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve             # http://localhost:8000/api/v1
php artisan queue:work        # e-mails du formulaire de contact
php artisan test              # 102 tests sur PostgreSQL (base portfolio_test)
```
