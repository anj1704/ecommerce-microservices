import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // --- MOCK DATA (Updated with Captions only) ---
  const MOCK_BOOKS = [
    { id: 1, caption: 'A comprehensive guide to Cloud Computing concepts and service models by Thomas Erl.', price: 49.99 },
    { id: 2, caption: 'Designing Data-Intensive Applications: The Big Ideas Behind Reliable Systems.', price: 35.50 },
    { id: 3, caption: 'The Pragmatic Programmer: From Journeyman to Master. Essential reading for devs.', price: 45.00 },
    { id: 4, caption: 'Clean Code: A Handbook of Agile Software Craftsmanship by Robert C. Martin.', price: 42.00 },
    { id: 5, caption: 'Introduction to Algorithms by CLRS. The standard textbook for algorithms.', price: 80.00 },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // ✅ REAL CODE
        const endpoint = searchQuery ? `/products?q=${searchQuery}` : '/products';
        const response = await api.get(endpoint);
        
        // Simple Mapping: Ensure ID and Caption exist
        const mappedProducts = response.data.map(item => ({
          ...item,
          id: item.id || item.book_id, // Handle cases where backend might use book_id
          caption: item.caption // We rely 100% on this now
        }));

        setProducts(mappedProducts);
        
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); 

  const handleAddToCart = (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to add items to cart!");
      return;
    }
    // Just showing a truncated caption in the alert
    alert(`Added item to cart: "${product.caption.substring(0, 20)}..."`);
  };

  // ✅ UPDATED SEARCH LOGIC: Filter by CAPTION
  const filteredProducts = products.filter(p => 
    p.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {filteredProducts.length > 0 ? (
            filteredProducts.map(book => (
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