<?php

declare(strict_types=1);

namespace Djamo\Example;

/**
 * Verifies the HMAC-SHA256 signature Djamo sends on each webhook.
 *
 * Djamo computes HMAC-SHA256 over the *raw* request body using your
 * DJAMO_WEBHOOK_SECRET, base64-encodes it, and sends it in the
 * `x-djamo-hmac-sha256` header. We must hash the raw bytes received — never a
 * re-encoded version of the parsed JSON — so the digest matches.
 */
final class WebhookVerifier
{
    public const HEADER = 'x-djamo-hmac-sha256';

    public function __construct(private readonly ?string $secret = null)
    {
    }

    /** True when no secret is configured (verification disabled). */
    public function isDisabled(): bool
    {
        return $this->secret === null || $this->secret === '';
    }

    public function verify(string $rawBody, ?string $signature): bool
    {
        if ($this->isDisabled()) {
            return true;
        }
        if ($signature === null || $signature === '') {
            return false;
        }

        $expected = base64_encode(hash_hmac('sha256', $rawBody, (string) $this->secret, true));

        return hash_equals($expected, $signature);
    }
}
