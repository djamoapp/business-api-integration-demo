import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../api';
import './CartPage.css';

function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const removeItem = (productId: number) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h1>Panier</h1>
        <div className="empty-cart">
          <p>Votre panier est vide</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Voir les produits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Panier</h1>
      <div className="cart-content">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.product.id} className="cart-item">
              <img src={item.product.image} alt={item.product.name} />
              <div className="item-info">
                <h3>{item.product.name}</h3>
                <p className="price">{item.product.price.toFixed(2)} FCFA</p>
              </div>
              <div className="quantity-controls">
                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                  −
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                  min="1"
                />
                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                  +
                </button>
              </div>
              <div className="item-total">
                {(item.product.price * item.quantity).toFixed(2)} FCFA
              </div>
              <button className="remove-btn" onClick={() => removeItem(item.product.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <div className="total">
            <span>Total:</span>
            <span className="total-amount">{total.toFixed(2)} FCFA</span>
          </div>
          <button
            className="btn btn-primary btn-large"
            onClick={() => navigate('/checkout')}
          >
            Passer la commande
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;

