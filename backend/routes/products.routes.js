import express from 'express';
import { readJSON, PRODUCTS_FILE } from '../utils/fileStorage.js';

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let products = readJSON(PRODUCTS_FILE);

    if (category) {
      products = products.filter(p => p.category === category);
    }


    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', (req, res) => {
  try {
    const products = readJSON(PRODUCTS_FILE);
    const product = products.find(p => p.id === parseInt(req.params.id));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get categories
router.get('/categories/list', (req, res) => {
  try {
    const products = readJSON(PRODUCTS_FILE);
    const categories = [...new Set(products.map(p => p.category))];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;

