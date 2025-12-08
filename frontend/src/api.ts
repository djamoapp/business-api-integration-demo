import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL|| 'http:/localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'dropped' | 'refunded';
  chargeId?: string;
  chargeStatus?: string;
  qrCode?: string;
  paymentUrl?: string;
  refundStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export const productApi = {
  getAll: async (category?: string): Promise<Product[]> => {
    const params = category ? { category } : {};
    const response = await api.get('/products', { params });
    return response.data;
  },
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/products/categories/list');
    return response.data;
  }
};

export const orderApi = {
  create: async (items: CartItem[], userId?: string, customerInfo?: any): Promise<Order> => {
    const response = await api.post('/orders', {
      items: items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      userId,
      customerInfo
    });
    return response.data;
  },
  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  getByUserId: async (userId: string): Promise<Order[]> => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },
  createRefund: async (orderId: string, reason?: string): Promise<any> => {
    const response = await api.post(`/orders/${orderId}/refund`, { reason });
    return response.data;
  }
};

export const paymentApi = {
  checkStatus: async (chargeId: string): Promise<any> => {
    const response = await api.get(`/payment/status/${chargeId}`);
    return response.data;
  }
};

