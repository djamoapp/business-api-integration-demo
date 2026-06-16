<?php

declare(strict_types=1);

/**
 * Front controller / router for the Djamo Business API PHP example.
 *
 * Run with PHP's built-in server:
 *   php -S localhost:8000 -t public
 *
 * All routes are dispatched from here. There is no framework — just a small
 * method+path matcher — to keep the example dependency-free.
 */

use Djamo\Example\Config;
use Djamo\Example\DjamoClient;
use Djamo\Example\DjamoException;
use Djamo\Example\Storage;
use Djamo\Example\WebhookVerifier;

// Bare-bones PSR-4-ish autoloader for the src/ namespace.
spl_autoload_register(static function (string $class): void {
    $prefix = 'Djamo\\Example\\';
    if (str_starts_with($class, $prefix)) {
        $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
        $file = dirname(__DIR__) . "/src/$relative.php";
        if (is_file($file)) {
            require $file;
        }
    }
});

Config::load();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/', '/') ?: '/';

/** Send a JSON response and stop. */
function respond(int $status, mixed $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** Decode the JSON request body into an array (empty on no/invalid body). */
function jsonBody(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** A loosely-unique reference for orders/transfers (no ext deps). */
function newReference(string $prefix): string
{
    return $prefix . '_' . bin2hex(random_bytes(8));
}

$storage = new Storage();

try {
    // --- Health -------------------------------------------------------------
    if ($method === 'GET' && $path === '/api/health') {
        respond(200, ['status' => 'ok', 'message' => 'Djamo PHP example is running']);
    }

    // --- Create a payment (charge) -----------------------------------------
    if ($method === 'POST' && $path === '/api/payments') {
        $body = jsonBody();
        $amount = isset($body['amount']) ? (int) $body['amount'] : 0;
        if ($amount <= 0) {
            respond(400, ['error' => 'amount is required and must be a positive integer']);
        }

        $externalId = (string) ($body['externalId'] ?? newReference('order'));
        $client = new DjamoClient();
        $charge = $client->createCharge([
            'amount' => $amount,
            'externalId' => $externalId,
            'description' => (string) ($body['description'] ?? 'Payment'),
            'onCompletedRedirectionUrl' => $body['onCompletedRedirectionUrl'] ?? null,
            'onCanceledRedirectionUrl' => $body['onCanceledRedirectionUrl'] ?? null,
        ]);

        // Persist a local order keyed by the Djamo charge id.
        $storage->save('orders', [
            'id' => $externalId,
            'chargeId' => $charge['id'] ?? null,
            'amount' => $amount,
            'status' => 'pending',
            'chargeStatus' => $charge['status'] ?? 'created',
            'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
        ]);

        respond(201, [
            'order' => ['id' => $externalId, 'status' => 'pending'],
            'chargeId' => $charge['id'] ?? null,
            'paymentUrl' => $charge['paymentUrl'] ?? null,
            'charge' => $charge,
        ]);
    }

    // --- Refund a charge ----------------------------------------------------
    // (matched before the generic GET status route below)
    if ($method === 'POST' && preg_match('#^/api/payments/([^/]+)/refund$#', $path, $m)) {
        $chargeId = urldecode($m[1]);
        $body = jsonBody();
        $amount = isset($body['amount']) ? (int) $body['amount'] : null;

        $client = new DjamoClient();
        $refund = $client->refundCharge($chargeId, $amount);

        $order = $storage->findBy('orders', 'chargeId', $chargeId);
        if ($order !== null) {
            $order['status'] = 'refunded';
            $order['chargeStatus'] = $refund['status'] ?? 'refunded';
            $order['updatedAt'] = gmdate('Y-m-d\TH:i:s\Z');
            $storage->save('orders', $order);
        }

        respond(200, ['refund' => $refund, 'order' => $order]);
    }

    // --- Get payment (charge) status ---------------------------------------
    if ($method === 'GET' && preg_match('#^/api/payments/([^/]+)$#', $path, $m)) {
        $chargeId = urldecode($m[1]);
        $client = new DjamoClient();
        $charge = $client->getCharge($chargeId);

        // Keep the local order in sync with the charge status.
        $order = $storage->findBy('orders', 'chargeId', $chargeId);
        if ($order !== null) {
            $order = applyChargeStatus($order, (string) ($charge['status'] ?? ''));
            $storage->save('orders', $order);
        }

        respond(200, [
            'chargeId' => $chargeId,
            'status' => $charge['status'] ?? null,
            'charge' => $charge,
            'order' => $order,
        ]);
    }

    // --- Create a transfer to a phone number -------------------------------
    if ($method === 'POST' && $path === '/api/transfers') {
        $body = jsonBody();
        $msisdn = trim((string) ($body['msisdn'] ?? ''));
        $amount = isset($body['amount']) ? (int) $body['amount'] : 0;

        if ($msisdn === '' || !preg_match('/^\+\d{8,15}$/', $msisdn)) {
            respond(400, ['error' => 'msisdn is required in E.164 format, e.g. +22507XXXXXXXX']);
        }
        if ($amount <= 0) {
            respond(400, ['error' => 'amount is required and must be a positive integer']);
        }

        // Idempotency: reuse the caller's reference or generate one.
        $reference = (string) ($body['reference'] ?? newReference('transfer'));

        $client = new DjamoClient();
        $transfer = $client->createTransfer([
            'msisdn' => $msisdn,
            'amount' => $amount,
            'reference' => $reference,
            'description' => (string) ($body['description'] ?? 'Transfer'),
        ]);

        $storage->save('transfers', [
            'id' => $transfer['id'] ?? $reference,
            'reference' => $reference,
            'msisdn' => $msisdn,
            'amount' => $amount,
            'status' => $transfer['status'] ?? 'pending',
            'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
        ]);

        respond(201, ['transfer' => $transfer]);
    }

    // --- Get transfer status -----------------------------------------------
    if ($method === 'GET' && preg_match('#^/api/transfers/([^/]+)$#', $path, $m)) {
        $id = urldecode($m[1]);
        $client = new DjamoClient();
        $transaction = $client->getTransaction($id);

        $transfer = $storage->findBy('transfers', 'id', $id);
        if ($transfer !== null) {
            $transfer['status'] = $transaction['status'] ?? $transfer['status'];
            $transfer['updatedAt'] = gmdate('Y-m-d\TH:i:s\Z');
            $storage->save('transfers', $transfer);
        }

        respond(200, [
            'id' => $id,
            'status' => $transaction['status'] ?? null,
            'transaction' => $transaction,
            'transfer' => $transfer,
        ]);
    }

    // --- Webhook listener ---------------------------------------------------
    if ($method === 'POST' && $path === '/api/webhook') {
        $rawBody = file_get_contents('php://input') ?: '';
        $signature = $_SERVER['HTTP_X_DJAMO_HMAC_SHA256'] ?? null;

        $verifier = new WebhookVerifier(Config::get('DJAMO_WEBHOOK_SECRET'));
        if (!$verifier->verify($rawBody, $signature)) {
            error_log('⚠️  Invalid webhook signature');
            respond(401, ['error' => 'Invalid signature']);
        }

        $event = json_decode($rawBody, true);
        if (!is_array($event)) {
            respond(400, ['error' => 'Invalid JSON payload']);
        }

        $topic = (string) ($event['topic'] ?? '');
        $data = is_array($event['data'] ?? null) ? $event['data'] : [];
        error_log("📥 Webhook received: $topic");

        switch ($topic) {
            case 'charge/events':
                handleChargeEvent($storage, $data);
                break;
            case 'transactions/started':
            case 'transactions/completed':
            case 'transactions/failed':
                handleTransactionEvent($storage, $topic, $data);
                break;
            default:
                error_log("Unknown webhook topic: $topic");
        }

        respond(200, ['received' => true]);
    }

    respond(404, ['error' => 'Not found', 'path' => $path, 'method' => $method]);
} catch (DjamoException $e) {
    // Surface the upstream status when we have one, else 502.
    $status = $e->httpStatus >= 400 ? $e->httpStatus : 502;
    respond($status, ['error' => $e->getMessage(), 'details' => $e->responseBody]);
} catch (Throwable $e) {
    error_log('Unhandled error: ' . $e->getMessage());
    respond(500, ['error' => 'Internal server error', 'message' => $e->getMessage()]);
}

// ---- Webhook handlers ------------------------------------------------------

/** Map a Djamo charge status onto the local order and return the updated record. */
function applyChargeStatus(array $order, string $chargeStatus): array
{
    switch ($chargeStatus) {
        case 'paid':
            $order['status'] = 'paid';
            break;
        case 'refunded':
            $order['status'] = 'refunded';
            break;
        case 'dropped':
        case 'cancelled':
            $order['status'] = 'failed';
            break;
        case 'due':
        case 'created':
            $order['status'] = 'pending';
            break;
    }
    $order['chargeStatus'] = $chargeStatus;
    $order['updatedAt'] = gmdate('Y-m-d\TH:i:s\Z');
    return $order;
}

function handleChargeEvent(Storage $storage, array $data): void
{
    $chargeId = $data['id'] ?? null;
    $order = $chargeId === null ? null : $storage->findBy('orders', 'chargeId', $chargeId);
    if ($order === null) {
        error_log("⚠️  Order not found for chargeId: " . var_export($chargeId, true));
        return;
    }
    $order = applyChargeStatus($order, (string) ($data['status'] ?? ''));
    $storage->save('orders', $order);
    error_log("📝 Order {$order['id']} updated to {$order['status']}");
}

function handleTransactionEvent(Storage $storage, string $topic, array $data): void
{
    $id = $data['id'] ?? null;
    // Fall back to matching on our reference if the id isn't found.
    $transfer = $id === null ? null : $storage->findBy('transfers', 'id', $id);
    if ($transfer === null && isset($data['reference'])) {
        $transfer = $storage->findBy('transfers', 'reference', $data['reference']);
    }
    if ($transfer === null) {
        error_log("⚠️  Transfer not found for transaction: " . var_export($id, true));
        return;
    }

    $transfer['status'] = match ($topic) {
        'transactions/completed' => 'completed',
        'transactions/failed' => 'failed',
        default => $data['status'] ?? 'pending',
    };
    if (isset($data['failureReason'])) {
        $transfer['failureReason'] = $data['failureReason'];
    }
    $transfer['updatedAt'] = gmdate('Y-m-d\TH:i:s\Z');
    $storage->save('transfers', $transfer);
    error_log("📝 Transfer {$transfer['id']} updated to {$transfer['status']}");
}
