import express from 'express';
import { readJSON, writeJSON, ORDERS_FILE } from '../utils/fileStorage.js';
import djamoService from '../services/djamo.service.js';

const router = express.Router();                  

// Create order and charge
router.post('/', async (req, res) => {
  try {
    const { items, userId, customerInfo } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create charge with Djamo
    const chargeData = {
      amount: total, 
      currency: 'XOF',
      description: `Commande de ${items.length} produit(s)`,
      externalId: `order_${Date.now()}`,
      onCompletedRedirectionUrl: `${process.env.FRONTEND_URL}/orders/`,
      onCanceledRedirectionUrl: `${process.env.FRONTEND_URL}/orders/`,
    };

    const charge = await djamoService.createCharge(chargeData);

    // Create order
    const order = {
      id: `order_${Date.now()}`,
      userId: userId || 'anonymous',
      items,
      total,
      status: 'pending',
      chargeId: charge.id || charge.data?.id,
      chargeStatus: charge.status || 'due',
      paymentUrl: charge.paymentUrl || charge.data?.paymentUrl,
      customerInfo: customerInfo || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save order
    const orders = readJSON(ORDERS_FILE);
    orders.push(order);
    writeJSON(ORDERS_FILE, orders);

    console.log('Order created:', order);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Get order by ID
router.get('/:id', (req, res) => {
  try {
    const orders = readJSON(ORDERS_FILE);
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get orders by user ID
router.get('/user/:userId', (req, res) => {
  try {
    const orders = readJSON(ORDERS_FILE);
    const userOrders = orders.filter(o => o.userId === req.params.userId);
    res.json(userOrders);
    console.log('Orders fetched:', userOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const orders = readJSON(ORDERS_FILE);
    const orderIndex = orders.findIndex(o => o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    writeJSON(ORDERS_FILE, orders);

    res.json(orders[orderIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Create refund
router.post('/:id/refund', async (req, res) => {
  try {
    const orders = readJSON(ORDERS_FILE);
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ error: 'Only paid orders can be refunded' });
    }

    if (order.refundStatus === 'pending' || order.refundStatus === 'succeeded') {
      return res.status(400).json({ error: 'Refund already processed' });
    }

    const refundData = {
      amount: Math.round(order.total * 100), // Convert to cents
      reason: req.body.reason || 'Customer request'
    };

    const refund = await djamoService.createRefund(order.chargeId, refundData);

    // Update order
    order.refundStatus = 'pending';
    order.refundId = refund.id;
    order.updatedAt = new Date().toISOString();
    writeJSON(ORDERS_FILE, orders);

    res.json({ order, refund });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ error: error.message || 'Failed to create refund' });
  }
});

export default router;

