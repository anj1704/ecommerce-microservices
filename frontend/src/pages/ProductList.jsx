import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../api';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 1. Determine Search Term
        // Since it's a General Store, we default to "item" to get a broad list
        // if the search bar is empty.
        const queryTerm = searchQuery || "item"; 
        const endpoint = `/search?q=${queryTerm}&limit=100`;
        
        // 2. Call the Real API
        const response = await api.get(endpoint);
        
        // 3. Map Data: Backend (Search Service) -> Frontend (UI)
        // The Search Service returns { results: [...] }
        const rawItems = response.data.results || []; 

        const mappedProducts = rawItems.map(item => ({
          ...item,
          id: item.item_id,
          caption: item.description,
          price: parseFloat(item.price),
          // ✅ NEW: Map the backend image URL to the frontend object
          image: item.image_url 
        }));

        setProducts(mappedProducts);
        
      } catch (err) {
        console.error("Failed to fetch products:", err);
        // If the API fails, we show nothing (no mock data fallback)
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search (wait 500ms after typing stops)
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]); 

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token) {
      alert("Please login to shop!");
      return;
    }

    if (!userId) {
      alert("Session error: User ID missing. Please logout and login again.");
      return;
    }

    try {
      // 4. Real Add To Cart Logic
      // Matches the endpoint: POST /cart/{user_id}/add
      await api.post(`/cart/${userId}/add`, {
        item_id: product.id,
        quantity: 1,
        price: product.price
      });
      
      alert(`Added to cart: "${product.caption.substring(0, 20)}..."`);
    } catch (err) {
      console.error("Add to cart failed:", err);
      alert("Failed to add item to cart.");
    }
  };

  return (
    <div className="container">
      
      {/* Hero Search Section - Rebranded for CloudMart */}
      <div style={{ 
        marginBottom: '30px', 
        display: 'flex', 
        gap: '10px', 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
      }}>
        <input 
          type="text" 
          placeholder="Search for items, electronics, groceries..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }} 
        />
        <button>Search</button>
      </div>

      {loading ? (
        <p style={{textAlign: 'center', color: '#666'}}>Loading inventory...</p>
      ) : (
        <div className="grid"> 
          {products.length > 0 ? (
            products.map(item => (
              <ProductCard key={item.id} product={item} onAddToCart={handleAddToCart} />
            ))
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '18px', color: '#64748b' }}>No items found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}