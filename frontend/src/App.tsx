import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderPage from './pages/OrderPage';
import './App.css';

function getOrCreateUserId(): string {
  const existing = localStorage.getItem('userId');
  if (existing) return existing;
  const newId = crypto.randomUUID();
  localStorage.setItem('userId', newId);
  return newId;
}

const userId = getOrCreateUserId();

function App() {
  return (
    <BrowserRouter>
      <div className="app">

        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              🛒 Djamo Test Shop
            </Link>
            <nav>
              <Link to="/">Produits</Link>
              <Link to="/cart">Panier</Link>
              <Link to="/orders">Commandes</Link>
            </nav>
          </div>
        </header>
        <div className="demo-banner">
          ⚠️ Attention : Ce site est une plateforme de démonstration. Aucun article n’est réellement vendu. Toutefois, tout paiement effectué sera bien débité et facturé
        </div>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage userId={userId} />} />
            <Route path="/orders" element={<OrderPage userId={userId} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

