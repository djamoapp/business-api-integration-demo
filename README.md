# Djamo Business API — Integration Examples

Two self-contained examples that integrate the [**Djamo Business API**](https://docs.djamo.com/)
— pick the one matching your stack. Both demonstrate the same three core flows:

1. **Collection** — create a payment (charge) and track its status
2. **Webhooks** — receive events and verify the HMAC signature
3. **Transfer** — send money to a customer's phone number

## Projects

| Folder      | Stack                                   | What it is                                                                 |
|-------------|-----------------------------------------|----------------------------------------------------------------------------|
| [`nodejs/`](nodejs/README.md) | Node.js + Express, React + Vite + TS   | Full-stack e-commerce demo (backend API + web frontend). The reference implementation. |
| [`php/`](php/README.md)       | PHP 8.1+, no framework, no Composer    | Minimal API-only example serving the same flows on PHP's built-in server.  |

The two projects are independent at runtime — there's no shared code or build.
Each has its own README with setup, environment variables, and runnable examples.

## Quick start

**Node.js** (see [`nodejs/README.md`](nodejs/README.md)):

```bash
cd nodejs/backend && npm install && npm run dev   # API on :3001
cd nodejs/frontend && npm install && npm run dev  # web on :5173
```

**PHP** (see [`php/README.md`](php/README.md)):

```bash
cd php && cp .env.example .env   # fill in credentials
php -S localhost:8000 -t public
```

## Credentials

Both examples need the same Djamo credentials (`DJAMO_ACCESS_TOKEN`,
`DJAMO_COMPANY_ID`, `DJAMO_API_URL`, optional `DJAMO_WEBHOOK_SECRET`),
configured per-project in their respective `.env` files. Never expose the
access token client-side — it can move money from your business account.

## API reference

Official documentation: <https://docs.djamo.com/>
