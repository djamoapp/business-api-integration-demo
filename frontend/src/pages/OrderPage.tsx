import { useState, useEffect } from 'react';
import { orderApi, Order } from '../api';
import './OrderPage.css';

function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getByUserId('user_123');
      // Validation : s'assurer que la réponse est bien un tableau
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error('Format inattendu pour les commandes:', data);
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      // Afficher plus de détails sur l'erreur
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rembourser cette commande ?')) {
      return;
    }

    try {
      await orderApi.createRefund(orderId, 'Demande client');
      alert('Demande de remboursement créée avec succès');
      loadOrders();
    } catch (error: any) {
      console.error('Error creating refund:', error);
      alert(error.response?.data?.error || 'Erreur lors de la demande de remboursement');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#2ecc71';
      case 'failed':
        return '#ff4757';
      case 'refunded':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'paid':
        return 'Payé';
      case 'failed':
        return 'Échoué';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="order-page">
        <h1>Mes Commandes</h1>
        <div className="empty-orders">
          <p>Aucune commande pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <h1>Mes Commandes</h1>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div>
                <h3>Commande #{order.id}</h3>
                <p className="order-date">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="order-items">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="order-item">
                  <span>{item.name || item.product?.name} x{item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} FCFA</span>
                </div>
              ))}
            </div>
            <div className="order-footer">
              <div className="order-total">
                <span>Total:</span>
                <span>{order.total.toFixed(2)} FCFA</span>
              </div>
              {order.status === 'paid' && order.refundStatus !== 'succeeded' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRefund(order.id)}
                  disabled={order.refundStatus === 'pending'}
                >
                  {order.refundStatus === 'pending' ? 'Remboursement en cours...' : 'Demander un remboursement'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderPage;

