# Djamo Business API — PHP example

A minimal, dependency-free PHP implementation of the **Djamo Business API**. It demonstrates the three core flows:

1. **Collection** — create a payment (charge) and poll its status
2. **Webhooks** — receive charge/transaction events and verify the HMAC signature
3. **Transfer** — send money to a customer's phone number and poll its status

Everything runs on PHP's built-in web server with no Composer dependencies —
just `curl` (bundled with PHP) and the standard library.

> API reference: <https://docs.djamo.com/>

## Requirements

- PHP >= 8.1 with the `curl` and `json` extensions (both standard).

## Setup

```bash
cd php
cp .env.example .env
# edit .env and fill in your credentials
```

`.env`:

```
DJAMO_ACCESS_TOKEN=at_xxx          # access token (prefixed with at_)
DJAMO_API_URL=https://apibusiness.civ.staging.djam.ooo
DJAMO_COMPANY_ID=xxx
DJAMO_WEBHOOK_SECRET=xxx           # optional; enables webhook signature checks
PORT=8000
```

## Run

```bash
cd php
php -S localhost:8000 -t public
```

The router lives in `public/index.php`; all routes are served from there.

## Endpoints

| Method | Path                       | Description                                  |
|--------|----------------------------|----------------------------------------------|
| GET    | `/api/health`              | Health check                                 |
| POST   | `/api/payments`            | Create a charge, returns `paymentUrl`        |
| GET    | `/api/payments/{chargeId}` | Get a charge status (polling)                |
| POST   | `/api/payments/{chargeId}/refund` | Refund a charge (full or partial)     |
| POST   | `/api/transfers`           | Send a transfer to a phone number            |
| GET    | `/api/transfers/{id}`      | Get a transfer status (polling)              |
| POST   | `/api/webhook`             | Receive Djamo events (charge + transfer)  |

Orders/transfers are persisted to `data/store.json` (a mock database).

## Examples

### Create a payment

```bash
curl -X POST localhost:8000/api/payments \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 10000,
    "externalId": "order_1001",
    "description": "Product purchase"
  }'
```

Returns the Djamo charge including `paymentUrl` — open it to authorize the payment.

### Poll payment status

```bash
curl localhost:8000/api/payments/<chargeId>
```

### Refund

```bash
# full refund
curl -X POST localhost:8000/api/payments/<chargeId>/refund

# partial refund
curl -X POST localhost:8000/api/payments/<chargeId>/refund \
  -H 'Content-Type: application/json' -d '{"amount": 5000}'
```

### Create a transfer

```bash
curl -X POST localhost:8000/api/transfers \
  -H 'Content-Type: application/json' \
  -d '{
    "msisdn": "+22507XXXXXXXX",
    "amount": 50000,
    "description": "Salaire de juin"
  }'
```

### Poll transfer status

```bash
curl localhost:8000/api/transfers/<transferId>
```

## Webhooks

Djamo signs each event with the `x-djamo-hmac-sha256` header
(base64-encoded HMAC-SHA256 of the raw request body, keyed with your
`DJAMO_WEBHOOK_SECRET`). The handler verifies it when the secret is set.

Topics handled:

- `charge/events` — updates the stored order to `paid` / `refunded` / `failed` / `pending`
- `transactions/completed`, `transactions/failed`, `transactions/started` — updates the stored transfer

To receive real webhooks locally, expose the server (e.g. with ngrok) and
register the webhook with Djamo:

```bash
ngrok http 8000
# then register the public URL via POST /v1/webhooks on the Djamo API
```

Simulate an event locally:

```bash
curl -X POST localhost:8000/api/webhook \
  -H 'Content-Type: application/json' \
  -d '{"topic":"charge/events","data":{"id":"<chargeId>","status":"paid","paid":10000}}'
```
