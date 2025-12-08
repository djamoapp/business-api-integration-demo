# 🛒 Djamo E-Commerce - Collection API Integration

Complete example project of an e-commerce site integrating Djamo Collection API for payments and refunds.

## 📋 Use Cases

This project demonstrates how to integrate Djamo into a real e-commerce site with:

### 🛍️ Client Side
- Browse a product catalog
- Add products to cart
- Pay with Djamo (payment URL that opens app on mobile or web page on desktop)
- See real-time payment confirmation
- View order history
- Request a refund for a paid order

### 💼 Merchant Side
- Automatically create Djamo charges
- Receive confirmation webhooks
- Handle refunds
- Track payment status

## ✨ Main Features

### Djamo Collection API
- ✅ Charge creation
- ✅ Payment URL for all devices
- ✅ Real-time status polling
- ✅ Refund system
- ✅ Webhooks for synchronization

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to Djamo API (ACCESS_TOKEN)

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### 2. Configuration

Create a `.env` file in the `backend/` folder:

```env
DJAMO_ACCESS_TOKEN=your_access_token_here
DJAMO_API_URL=https://apibusiness.civ.staging.djam.ooo
DJAMO_COMPANY_ID=your_company_id_here
DJAMO_WEBHOOK_SECRET=your_webhook_secret_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Environment Variables:**
- `DJAMO_ACCESS_TOKEN`: Djamo API access token (required)
- `DJAMO_API_URL`: Djamo API URL (default: `https://apibusiness.civ.staging.djam.ooo`)
- `DJAMO_COMPANY_ID`: Your Djamo company ID (required)
- `DJAMO_WEBHOOK_SECRET`: Secret to validate webhook signatures (optional but recommended)
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL (used for post-payment redirections)

Also create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:3001/api
```

**Frontend Environment Variables:**
- `VITE_API_URL`: Backend API URL (default: `http://localhost:3001/api`)
  - For local development, use `http://localhost:3001/api`
  - With ngrok, use the full ngrok URL: `https://your-domain.ngrok-free.dev/api`
  - ⚠️ **Important**: With Vite, all environment variables must be prefixed with `VITE_` to be accessible on the client side

### 3. Launch the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be accessible at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/api/health

**Note**: The frontend uses a Vite proxy to redirect `/api/*` requests to the local backend, allowing a single URL when exposing via ngrok.

## 📁 Project Structure

```
djamo-ecomerce/
├── backend/
│   ├── data/
│   │   ├── products.json      # Product catalog
│   │   └── orders.json         # Orders (mock DB)
│   ├── routes/
│   │   ├── products.routes.js # Products API
│   │   ├── orders.routes.js    # Orders API
│   │   ├── payment.routes.js  # Payment API (status)
│   │   └── webhook.routes.js  # Djamo webhooks
│   ├── services/
│   │   └── djamo.service.js    # Djamo API service
│   ├── utils/
│   │   └── fileStorage.js     # JSON file management
│   ├── server.js               # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ProductPage.tsx     # Product catalog
│   │   │   ├── CartPage.tsx        # Cart
│   │   │   ├── CheckoutPage.tsx    # Payment
│   │   │   └── OrderPage.tsx       # Orders
│   │   ├── api.ts                  # API client
│   │   ├── App.tsx                 # Main component
│   │   └── main.tsx                # Entry point
│   ├── vite.config.ts              # Vite configuration (API proxy)
│   ├── ngrok.yml                   # ngrok configuration
│   └── package.json
└── README.md
```

## 🔄 Payment Flow

1. **Client adds products to cart** → Stored in localStorage
2. **Client places order** → `POST /api/orders` creates a Djamo charge via `djamoService.createCharge()`
3. **Backend returns**:
   - `chargeId`: Djamo charge ID
   - `paymentUrl`: Payment URL (used for all devices)
4. **Frontend automatically redirects** → Client is redirected to `paymentUrl`
5. **Djamo payment page**:
   - **On mobile**: Automatically opens the Djamo application
   - **On desktop**: Displays the web payment page
6. **Automatic polling**: Frontend queries `GET /api/payment/status/:chargeId` every 3 seconds
7. **Webhook received**: Djamo sends a `charge/events` webhook to `POST /api/webhook`
8. **Backend updates**: Order is updated with the new status
9. **Client sees confirmation**: Automatic redirection to `/orders` when status becomes `paid`

## 💡 Important Points

### 🔄 Refunds
The refund system is implemented with:
- Endpoint: `POST /v1/charges/:id/refund`
- Fallback simulation mode if endpoint returns 404
- Handling of `charge/events` webhooks with `refunded` status

⚠️ **Note**: The refund endpoint may vary depending on the environment. A simulation fallback is provided if the endpoint is not available.

### 📡 Webhooks
Webhooks are handled via the `/api/webhook` endpoint and process `charge/events` events with the following statuses:
- `paid` → Order marked as paid
- `dropped` / `cancelled` → Order marked as failed
- `refunded` → Order marked as refunded
- `due` → Order still pending

### 📱 Mock Database
I use JSON files to simplify the demo. In production:
- Replace with PostgreSQL / MongoDB
- Add an authentication system
- Implement webhook validation

## 🎨 Design
Modern and responsive interface with:
- Persistent cart (localStorage)
- Clear visual statuses
- Mobile-first
- Real-time feedback

## 🔒 Security

⚠️ **IMPORTANT**: The ACCESS_TOKEN must NEVER be exposed on the client side. It remains only in the backend.

- Webhook signature validation (if webhook secret configured)
- HTTPS required in production
- Rate limiting recommended on backend
- Logs without sensitive data

## 📚 API Documentation

Consult the official Djamo documentation: https://docs.djamo.com/

## 🌐 Expose Frontend via ngrok

To expose your application locally via ngrok (useful for testing webhooks or accessing the application from another device):

### Prerequisites
- Have an ngrok account (free): https://ngrok.com/
- Install ngrok: https://ngrok.com/download

### Configuration

1. **Get your ngrok authtoken**:
   - Log in at https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your token

2. **Configure ngrok**:
   The `frontend/ngrok.yml` file is already configured. Update the authtoken if necessary:
   
   ```yaml
   version: "2"
   authtoken: YOUR_AUTHTOKEN_HERE
   
   tunnels:
     frontend:
       addr: 5173
       proto: http
   ```

3. **Update Vite configuration**:
   In `frontend/vite.config.ts`, update `allowedHosts` with your ngrok domain:
   
   ```typescript
   allowedHosts: ['your-domain.ngrok-free.dev'],
   ```

4. **Update frontend URL in backend**:
   In `backend/.env`, update `FRONTEND_URL` with your ngrok URL:
   
   ```env
   FRONTEND_URL=https://your-domain.ngrok-free.dev
   ```

5. **Configure webhook URL in Djamo**:
   
   Use the Djamo API to register your webhook. Replace `{{ACCESS_TOKEN}}` with your access token and `your-domain.ngrok-free.dev` with your ngrok URL:
   
   ```bash
   curl --request POST \
     --url https://apibusiness.civ.staging.djam.ooo/v1/webhooks \
     --header 'authorization: Bearer YOUR_ACCESS_TOKEN' \
     --header 'content-type: application/json' \
     --data '{
       "topic": "charge/events",
       "url": "https://your-domain.ngrok-free.dev/api/webhook"
     }'
   ```
   
   **Note**: This URL will be used by Djamo to send payment notifications (paid, cancelled, refunded charges, etc.).
   

### Launch ngrok

```bash
# From the frontend folder
cd frontend
ngrok start frontend
```

Or directly with the configuration:

```bash
ngrok start --config frontend/ngrok.yml frontend
```

### Access the Application

Once ngrok is launched, you will get a public URL (e.g., `https://xxxxx.ngrok-free.dev`) that:
- Exposes the frontend on port 5173
- Automatically proxies `/api/*` requests to the local backend (port 3001)
- Allows using a single URL for frontend and backend

**Important**:
- The backend remains local (not directly exposed)
- All API requests go through the Vite proxy


## 📡 API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Product details
- `GET /api/products/categories/list` - List categories

### Orders
- `POST /api/orders` - Create an order and a Djamo charge
- `GET /api/orders/:id` - Order details
- `GET /api/orders/user/:userId` - User orders
- `PATCH /api/orders/:id/status` - Update status
- `POST /api/orders/:id/refund` - Create a refund

### Payment
- `GET /api/payment/status/:chargeId` - Check payment status

### Webhooks
- `POST /api/webhook` - Receive Djamo webhooks

### Health
- `GET /api/health` - Check that the API is online

## 🛠️ Technologies

- **Backend**: Node.js + Express
- **Frontend**: React + Vite + TypeScript
- **API Client**: Axios
- **Tunnel**: ngrok (for local exposure)

## 📝 License

This project is an integration example and can be used as a reference for your own projects.

