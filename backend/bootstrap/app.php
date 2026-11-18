<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum en mode SPA : les requêtes venant des domaines "stateful"
        // (Angular) sont authentifiées par cookie de session + jeton CSRF.
        $middleware->statefulApi();

        // API sans pages HTML : un invité n'est jamais redirigé vers une route "login"
        // (inexistante → erreur 500) ; il reçoit simplement un 401 en JSON.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Toujours répondre en JSON sous /api (401, 403, 404, 422…),
        // même si le client oublie l'en-tête Accept: application/json.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
