# Backend - Djamo E-commerce API

Express.js backend for Djamo Collection API integration.

## Configuration

Create a `.env` file at the root of `backend/`:

```env
DJAMO_ACCESS_TOKEN=your_access_token_here
DJAMO_API_URL=https://apibusiness.civ.staging.djam.ooo
DJAMO_COMPANY_ID=your_company_id_here
DJAMO_WEBHOOK_SECRET=your_webhook_secret_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Installation

```bash
npm install
```

## Start

```bash
# Development (watch)
npm run dev

```

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Product details
- `GET /api/products/categories/list` - List categories

### Orders
- `POST /api/orders` - Create an order and a Djamo charge
- `GET /api/orders/:id` - Order details
- `GET /api/orders/user/:userId` - Orders for a user
- `POST /api/orders/:id/refund` - Request a refund

### Payment
- `GET /api/payment/status/:chargeId` - Check payment status

### Webhooks
- `POST /api/webhook` - Endpoint to receive Djamo webhooks