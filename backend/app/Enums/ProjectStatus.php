<?php

declare(strict_types=1);

namespace App\Enums;

/** Valeurs autorisées : draft | published */
enum ProjectStatus: string
{
    case Draft = 'draft';
    case Published = 'published';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
