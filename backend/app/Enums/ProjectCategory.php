<?php

declare(strict_types=1);

namespace App\Enums;

/** Valeurs autorisées : web | api | mobile */
enum ProjectCategory: string
{
    case Web = 'web';
    case Api = 'api';
    case Mobile = 'mobile';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
