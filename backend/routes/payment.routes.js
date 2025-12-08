import express from 'express';
import djamoService from '../services/djamo.service.js';
import { readJSON, ORDERS_FILE } from '../utils/fileStorage.js';

const router = express.Router();

// Check payment status
router.get('/status/:chargeId', async (req, res) => {
  try {
    const { chargeId } = req.params;
    
    // Get charge status from Djamo
    const charge = await djamoService.getChargeStatus(chargeId);
    
    // Update order if exists
    const orders = readJSON(ORDERS_FILE);
    const order = orders.find(o => o.chargeId === chargeId);
    
    if (order) {
      order.chargeStatus = charge.status || charge.data?.status;
      if (charge.status === 'succeeded' || charge.data?.status === 'succeeded') {
        order.status = 'paid';
      } else if (charge.status === 'failed' || charge.data?.status === 'failed') {
        order.status = 'failed';
      }
      order.updatedAt = new Date().toISOString();
    }

    res.json({
      chargeId,
      status: charge.status || charge.data?.status,
      order: order || null
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: error.message || 'Failed to check payment status' });
  }
});

export default router;

