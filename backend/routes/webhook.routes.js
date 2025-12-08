import express from 'express';
import { readJSON, writeJSON, ORDERS_FILE } from '../utils/fileStorage.js';
import crypto from 'crypto';

const router = express.Router();

// Webhook endpoint
router.post('/', (req, res) => {
  try {
    console.log('📥 Webhook received:', req.body);
    const webhookSecret = process.env.DJAMO_WEBHOOK_SECRET;
    const signature = req.headers['x-djamo-signature'];

    // Verify signature if webhook secret is set
    if (webhookSecret && signature) {
      const payload = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('⚠️  Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const { topic, data } = event;

    console.log('📥 Webhook received:', topic);

    switch (topic) {
      case 'charge/events':
        handleChargeEvents(data);
        break;
      default:
        console.log('Unknown webhook type:', topic);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

function handleChargeEvents(data) {
  const orders = readJSON(ORDERS_FILE);
  const order = orders.find(o => o.chargeId === data.id);

  if (!order) {
    console.warn(`⚠️  Order not found for chargeId: ${data.id}`);
    return;
  }

  // Mise à jour du statut de la commande selon le statut de la charge
  switch (data.status) {
    case 'paid':
      order.status = 'paid';
      console.log(`✅ Order ${order.id} marked as paid`);
      break;
    case 'dropped':
    case 'cancelled':
      order.status = 'failed';
      console.log(`❌ Order ${order.id} marked as failed (dropped/cancelled)`);
      break;
    case 'refunded':
      order.status = 'refunded';
      order.refundStatus = 'succeeded';
      console.log(`💰 Order ${order.id} marked as refunded`);
      break;
    case 'due':
      order.status = 'pending';
      console.log(`⏳ Order ${order.id} still pending`);
      break;
    default:
      console.log(`⚠️  Unknown charge status: ${data.status} for order ${order.id}`);
      break;
  }

  // Mise à jour du statut de la charge et de la date de mise à jour
  order.chargeStatus = data.status;
  order.updatedAt = new Date().toISOString();
  
  // Sauvegarder les modifications
  writeJSON(ORDERS_FILE, orders);
  console.log(`📝 Order ${order.id} updated successfully`);
}



export default router;

