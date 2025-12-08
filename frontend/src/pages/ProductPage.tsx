import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, Product, CartItem } from '../api';
import './ProductPage.css';

function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCart();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory);
    } else {
      loadProducts();
    }
  }, [selectedCategory]);

  const loadProducts = async (category?: string) => {
    try {
      setLoading(true);
      const data = await productApi.getAll(category);
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Format inattendu pour les produits', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await productApi.getCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Format inattendu pour les catégories', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const addToCart = (product: Product) => {
    const savedCart = localStorage.getItem('cart');
    const currentCart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
    
    const existingItem = currentCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentCart.push({ product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(currentCart));
    setCart(currentCart);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="product-page">
      <div className="page-header">
        <h1>Catalogue Produits</h1>
        <div className="cart-summary" onClick={() => navigate('/cart')}>
          🛒 Panier ({cartItemCount})
        </div>
      </div>

      <div className="filters">
        <button
          className={selectedCategory === '' ? 'active' : ''}
          onClick={() => setSelectedCategory('')}
        >
          Tous
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={selectedCategory === cat ? 'active' : ''}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="category">{product.category}</p>
              <p className="description">{product.description}</p>
              <div className="product-footer">
                <span className="price">{product.price.toFixed(2)} FCFA</span>
                <button
                  className="btn btn-primary"
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                >
                  {product.stock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductPage;

