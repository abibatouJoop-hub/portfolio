<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Hors production, Eloquent lève une exception en cas de :
        //  - lazy loading (requête N+1 oubliée : il manque un ->with()),
        //  - attribut absent de $fillable (au lieu de l'ignorer en silence),
        //  - accès à un attribut qui n'a pas été chargé.
        Model::shouldBeStrict(! $this->app->isProduction());

        $this->configureRateLimiting();

        // Règles par défaut d'un nouveau mot de passe (utilisées par Password::defaults()).
        Password::defaults(fn () => Password::min(12)->letters()->mixedCase()->numbers());
    }

    /** Limites de débit : au-delà, Laravel répond 429 Too Many Requests. */
    private function configureRateLimiting(): void
    {
        // Connexion : 5 essais par minute pour un même couple email + IP (anti force brute).
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));

        // Mot de passe oublié / réinitialisation : 3 par minute et 10 par heure par IP
        // (évite d'inonder la boîte mail de l'admin et de tester des jetons en masse).
        RateLimiter::for('password-reset', fn (Request $request) => [
            Limit::perMinute(3)->by('minute|'.$request->ip()),
            Limit::perHour(10)->by('hour|'.$request->ip()),
        ]);

        // Formulaire de contact : 5 messages par heure et par IP (anti spam).
        RateLimiter::for('contact', fn (Request $request) => Limit::perHour(5)->by($request->ip()));
    }
}
