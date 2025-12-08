import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS : on autorise l'origine du front, y compris via ngrok,
// pour pouvoir utiliser une seule URL publique.
app.use(cors({
  origin: (origin, callback) => {
    // Autorise les requêtes sans origin (ex: outils, curl, etc.)
    if (!origin) return callback(null, true);
    // En dev, on accepte toutes les origines (localhost, ngrok, etc.).
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Import routes
import productRoutes from './routes/products.routes.js';
import orderRoutes from './routes/orders.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Djamo E-commerce API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
});

