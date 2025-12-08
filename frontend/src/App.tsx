import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderPage from './pages/OrderPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              🛒 Djamo Shop
            </Link>
            <nav>
              <Link to="/">Produits</Link>
              <Link to="/cart">Panier</Link>
              <Link to="/orders">Commandes</Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrderPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

