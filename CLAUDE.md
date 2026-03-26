# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack e-commerce demo integrating the **Djamo Collection API** for payments and refunds. Backend is Node.js/Express (ES Modules), frontend is React 18 + Vite + TypeScript.

## Development Commands

### Backend (`/backend`)
```bash
npm run dev    # Start with file watching (port 3001)
npm start      # Production start
npm run build  # TypeScript compile
```

### Frontend (`/frontend`)
```bash
npm run dev     # Vite dev server (port 5173)
npm run build   # TypeScript check + production build
npm run preview # Preview production build
```

### Running the full stack
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## Environment Setup

**`/backend/.env`** (required):
```
DJAMO_ACCESS_TOKEN=...
DJAMO_API_URL=https://apibusiness.civ.staging.djam.ooo
DJAMO_COMPANY_ID=...
DJAMO_WEBHOOK_SECRET=...   # optional, enables webhook signature validation
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**`/frontend/.env`** (required):
```
VITE_API_URL=http://localhost:3001/api
```

## Architecture

### Backend (`/backend`)

- **`server.js`** — Express entry point; mounts all routes under `/api`
- **`routes/`** — 4 route modules: `products`, `orders`, `payment`, `webhook`
- **`services/djamo.service.js`** — Djamo API client wrapping charge creation, status polling, refunds, and listing
- **`utils/fileStorage.js`** — JSON file read/write helpers used as a mock database
- **`data/`** — `products.json` (catalog) and `orders.json` (order storage)

### Frontend (`/frontend/src`)

- **`App.tsx`** — React Router setup with 4 routes: `/`, `/cart`, `/checkout`, `/orders`
- **`api.ts`** — Axios client; all TypeScript interfaces for Product, Order, CartItem live here
- **`pages/`** — One component per route; `CheckoutPage` polls `/api/payment/status/:chargeId` every 3 seconds until payment resolves

### Payment Flow

1. `POST /api/orders` — creates order + Djamo charge, returns `paymentUrl`
2. Frontend polls `GET /api/payment/status/:chargeId` every 3s
3. Djamo sends webhook to `POST /api/webhook` → updates order status in `orders.json`
4. Frontend redirects to `/orders` on success

### Webhook Handling

`/api/webhook` validates optional HMAC SHA256 signature then maps Djamo `charge/events` topic statuses (`paid`, `dropped`, `cancelled`, `refunded`, `due`) to internal order statuses.

### User sessions

`App.tsx` generates a random UUID via `crypto.randomUUID()` on first load and persists it in `localStorage` under the key `userId`. This ID is passed as a prop to `CheckoutPage` and `OrderPage` to isolate orders per browser. No auth system — private/incognito windows get a separate ID automatically.

### ngrok

`/frontend/ngrok.yml` configures a tunnel on port 5173 to expose the frontend publicly for webhook testing. The Vite config (`vite.config.ts`) proxies `/api` → `http://localhost:3001`, so the backend is reachable through the same ngrok URL without being exposed directly.

Launch: `ngrok start --config frontend/ngrok.yml frontend`

### API docs (Bruno collection)

`/backend/api-docs/` contains a Bruno collection covering all 11 endpoints. Open it with the Bruno desktop app, select the **Local** environment, and update the `orderId`/`chargeId` variables after creating a test order.