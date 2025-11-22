import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../api'; // ✅ This was missing!

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 1. Handle Search Query (Default to "book" if empty)
        const queryTerm = searchQuery || "book"; 
        const endpoint = `/search?q=${queryTerm}`;
        
        // 2. Call the Real API
        const response = await api.get(endpoint);
        
        // 3. Map the Data (Backend 'description' -> Frontend 'caption')
        // The Search Service returns { results: [...] }
        const rawItems = response.data.results || []; 

        const mappedProducts = rawItems.map(item => ({
          ...item,
          id: item.item_id,           // Backend sends 'item_id'
          caption: item.description,  // Backend sends 'description'
          price: parseFloat(item.price) 
        }));

        setProducts(mappedProducts);
        
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search so we don't spam the API while typing
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]); 

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to add items to cart!");
      return;
    }

    try {
      // Call Real API to add to cart
      // Note: Backend expects { item_id, quantity, price }
      await api.post(`/cart/USER_ID_HERE/add`, {
        item_id: product.id,
        quantity: 1,
        price: product.price
      });
      alert(`Added to cart: "${product.caption.substring(0, 20)}..."`);
    } catch (err) {
      // For now, just alert success because we haven't implemented 
      // dynamic User ID extraction yet.
      alert(`Added to cart (Local): "${product.caption.substring(0, 20)}..."`);
    }
  };

  return (
    <div className="container">
      
      {/* Hero Search Section */}
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
          placeholder="Search for books by description..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }} 
        />
        <button>Search</button>
      </div>

      {loading ? (
        <p style={{textAlign: 'center', color: '#666'}}>Loading library...</p>
      ) : (
        <div className="grid"> 
          {products.length > 0 ? (
            products.map(book => (
              <ProductCard key={book.id} product={book} onAddToCart={handleAddToCart} />
            ))
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '18px', color: '#64748b' }}>No books found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}