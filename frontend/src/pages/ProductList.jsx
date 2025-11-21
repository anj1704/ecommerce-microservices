import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
// import api from '../api'; // Keep this for later

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // --- MOCK DATA ---
  const MOCK_BOOKS = [
    { id: 1, title: 'Cloud Computing', author: 'Thomas Erl', price: 49.99 },
    { id: 2, title: 'Designing Data-Intensive Apps', author: 'Martin Kleppmann', price: 35.50 },
    { id: 3, title: 'The Pragmatic Programmer', author: 'Andy Hunt', price: 45.00 },
    { id: 4, title: 'Clean Code', author: 'Robert C. Martin', price: 42.00 },
    { id: 5, title: 'Introduction to Algorithms', author: 'CLRS', price: 80.00 },
  ];

  useEffect(() => {
    // Simulate fetching data from backend
    const fetchProducts = async () => {
      try {
        // --- REAL CODE (Commented out) ---
        // const response = await api.get(`/products?q=${searchQuery}`);
        // setProducts(response.data);

        // --- MOCK CODE ---
        console.log("Fetching products...");
        await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
        setProducts(MOCK_BOOKS);
        
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Runs once when page loads

  // Handle "Add to Cart" click
  const handleAddToCart = (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to add items to cart!");
      return;
    }
    console.log(`Adding book ${product.id} to cart...`);
    alert(`Added "${product.title}" to cart!`);
    // Later, we will call api.post('/cart', { book_id: product.id, quantity: 1 })
  };

  // Filter products based on search bar
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Search for books..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '10px', width: '100%', maxWidth: '400px', fontSize: '16px' }}
        />
        <button style={{ padding: '10px 20px' }}>Search</button>
      </div>

      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map(book => (
              <ProductCard key={book.id} product={book} onAddToCart={handleAddToCart} />
            ))
          ) : (
            <p>No books found.</p>
          )}
        </div>
      )}
    </div>
  );
}