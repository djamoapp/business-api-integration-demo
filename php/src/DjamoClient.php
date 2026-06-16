<?php

declare(strict_types=1);

namespace Djamo\Example;

/**
 * Thin client for the Djamo Business API — the PHP counterpart of the Node
 * backend's services/djamo.service.js.
 *
 * Covers the Collection API (charges) and the Transfer API (transactions).
 * See https://docs.djamo.com/ for the full reference.
 */
final class DjamoClient
{
    private string $baseUrl;
    private string $accessToken;
    private string $companyId;

    public function __construct(?string $baseUrl = null, ?string $accessToken = null, ?string $companyId = null)
    {
        $this->baseUrl = rtrim(
            $baseUrl ?? Config::get('DJAMO_API_URL', 'https://apibusiness.civ.staging.djam.ooo'),
            '/'
        );
        $this->accessToken = $accessToken ?? Config::require('DJAMO_ACCESS_TOKEN');
        $this->companyId = $companyId ?? Config::require('DJAMO_COMPANY_ID');
    }

    // ---- Collection API (charges) ----------------------------------------

    /**
     * Create a charge (payment request). The response includes a `paymentUrl`
     * the customer opens to authorize the payment.
     *
     * @param array{amount:int, externalId?:string, description?:string,
     *              onCompletedRedirectionUrl?:string, onCanceledRedirectionUrl?:string,
     *              metadata?:array} $charge
     */
    public function createCharge(array $charge): array
    {
        return $this->request('POST', '/v1/charges', $charge);
    }

    /** Retrieve a charge by id to poll its status (created/due/paid/refunded/dropped). */
    public function getCharge(string $chargeId): array
    {
        return $this->request('GET', '/v1/charges/' . rawurlencode($chargeId));
    }

    /**
     * Refund a charge. Pass an empty body for a full refund, or {"amount": N}
     * for a partial refund.
     */
    public function refundCharge(string $chargeId, ?int $amount = null): array
    {
        $body = $amount === null ? new \stdClass() : ['amount' => $amount];
        return $this->request('POST', '/v1/charges/' . rawurlencode($chargeId) . '/refund', $body);
    }

    // ---- Transfer API (transactions) -------------------------------------

    /**
     * Send a transfer to a customer's phone number.
     *
     * @param array{msisdn:string, amount:int, reference:string,
     *              description?:string} $transfer  type is forced to "transfer"
     */
    public function createTransfer(array $transfer): array
    {
        $transfer['type'] = 'transfer';
        return $this->request('POST', '/v1/transactions', $transfer);
    }

    /** Retrieve a transaction by id to poll its status (pending/completed/failed). */
    public function getTransaction(string $id): array
    {
        return $this->request('GET', '/v1/transactions/' . rawurlencode($id));
    }

    // ---- HTTP plumbing ----------------------------------------------------

    /**
     * @param array|\stdClass|null $body
     * @throws DjamoException on transport failure or non-2xx status
     */
    private function request(string $method, string $path, array|\stdClass|null $body = null): array
    {
        $ch = curl_init($this->baseUrl . $path);

        $headers = [
            'Authorization: Bearer ' . $this->accessToken,
            'X-Company-Id: ' . $this->companyId,
            'Accept: application/json',
        ];

        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ];

        if ($body !== null) {
            $options[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $headers[] = 'Content-Type: application/json';
        }

        $options[CURLOPT_HTTPHEADER] = $headers;
        curl_setopt_array($ch, $options);

        $raw = curl_exec($ch);
        if ($raw === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new DjamoException("Request to Djamo failed: $error");
        }

        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($decoded)) {
            $decoded = ['raw' => $raw];
        }

        if ($status < 200 || $status >= 300) {
            $message = $decoded['message'] ?? "Djamo API returned HTTP $status";
            throw new DjamoException($message, $status, $decoded);
        }

        return $decoded;
    }
}
