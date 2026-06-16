<?php

declare(strict_types=1);

namespace Djamo\Example;

/**
 * Thrown when the Djamo API returns a non-2xx response or the request fails.
 * Carries the HTTP status and the decoded response body for the caller.
 */
final class DjamoException extends \RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $httpStatus = 0,
        public readonly mixed $responseBody = null,
    ) {
        parent::__construct($message);
    }
}
