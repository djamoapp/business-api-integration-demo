import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi, paymentApi, CartItem, Order } from '../api';
import './CheckoutPage.css';

function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (order) {
      checkPaymentStatus();
      const interval = setInterval(checkPaymentStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [order]);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      navigate('/cart');
    }
  };

  const createOrder = async () => {
    if (cart.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    try {
      setLoading(true);
      const newOrder = await orderApi.create(cart, 'user_123');
      localStorage.removeItem('cart');
      setCart([]);
      
      // Rediriger automatiquement vers la page de paiement Djamo
      if (newOrder.paymentUrl) {
        window.location.href = newOrder.paymentUrl;
      } else {
        // Si pas de paymentUrl, sauvegarder la commande et afficher un message
        setOrder(newOrder);
        alert('Erreur : Aucune URL de paiement disponible');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!order?.chargeId) return;

    try {
      const status = await paymentApi.checkStatus(order.chargeId);
      setPaymentStatus(status.status);

      if (status.status === 'succeeded') {
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (!order) {
    return (
      <div className="checkout-page">
        <h1>Paiement</h1>
        <div className="checkout-summary">
          <div className="order-items">
            <h2>Récapitulatif de la commande</h2>
            {cart.map(item => (
              <div key={item.product.id} className="order-item">
                <span>{item.product.name} x{item.quantity}</span>
                <span>{(item.product.price * item.quantity).toFixed(2)} FCFA</span>
              </div>
            ))}
            <div className="order-total">
              <span>Total:</span>
              <span>{total.toFixed(2)} FCFA</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-large"
            onClick={createOrder}
            disabled={loading}
          >
            {loading ? 'Création de la commande...' : 'Créer la commande et payer'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Paiement</h1>
      <div className="payment-container">
        {paymentStatus === 'succeeded' ? (
          <div className="payment-success">
            <h2>✅ Paiement réussi !</h2>
            <p>Votre commande a été payée avec succès.</p>
            <p>Redirection vers vos commandes...</p>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="payment-failed">
            <h2>❌ Paiement échoué</h2>
            <p>Le paiement n'a pas pu être effectué.</p>
            <button className="btn btn-primary" onClick={() => navigate('/cart')}>
              Réessayer
            </button>
          </div>
        ) : (
          <div className="payment-pending">
            <h2>En attente de paiement</h2>
            <div className="payment-info">
              <p>Vous avez été redirigé depuis la page de paiement.</p>
              <p>Le statut de votre paiement sera mis à jour automatiquement.</p>
              <p className="status">Statut: {paymentStatus}</p>
              {order.paymentUrl && (
                <a
                  href={order.paymentUrl}
                  className="btn btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Retourner à la page de paiement
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutPage;

