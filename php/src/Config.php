<?php

declare(strict_types=1);

namespace Djamo\Example;

/**
 * Tiny .env loader + config accessor.
 *
 * Loads KEY=VALUE pairs from php-example/.env into the process environment
 * (only for keys not already set), so the example needs no Composer
 * dependency like vlucas/phpdotenv.
 */
final class Config
{
    private static bool $loaded = false;

    public static function load(?string $path = null): void
    {
        if (self::$loaded) {
            return;
        }
        self::$loaded = true;

        $path ??= dirname(__DIR__) . '/.env';
        if (!is_file($path)) {
            return;
        }

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
            $key = trim($key);
            $value = trim($value);
            // Strip surrounding quotes if present.
            $value = preg_replace('/^([\'"])(.*)\1$/', '$2', $value) ?? $value;

            if ($key !== '' && getenv($key) === false) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
            }
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = getenv($key);
        return $value === false ? $default : $value;
    }

    /** Get a required value or throw — fail fast on missing credentials. */
    public static function require(string $key): string
    {
        $value = self::get($key);
        if ($value === null || $value === '') {
            throw new \RuntimeException("Missing required config: $key (set it in php-example/.env)");
        }
        return $value;
    }
}
