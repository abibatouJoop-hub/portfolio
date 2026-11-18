<?php

declare(strict_types=1);

namespace App\Enums;

/** Valeurs autorisées : work | internship | education */
enum ExperienceType: string
{
    case Work = 'work';
    case Internship = 'internship';
    case Education = 'education';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
