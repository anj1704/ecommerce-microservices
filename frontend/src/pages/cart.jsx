import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Keep for later use

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- MOCK DATA (What the backend would send) ---
  const MOCK_CART = [
    { book_id: 1, title: 'Cloud Computing', author: 'Thomas Erl', price: 49.99, quantity: 1 },
    { book_id: 4, title: 'Clean Code', author: 'Robert C. Martin', price: 42.00, quantity: 2 },
  ];

  useEffect(() => {
    const fetchCart = async () => {
      try {
        // --- REAL CODE ---
        // const response = await api.get('/cart');
        // setCartItems(response.data.items);

        // --- MOCK CODE ---
        console.log("Fetching cart...");
        await new Promise(resolve => setTimeout(resolve, 500)); 
        setCartItems(MOCK_CART);
        
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // Calculate Total Price
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleRemove = (bookId) => {
    // Filter out the item to simulate removal
    setCartItems(cartItems.filter(item => item.book_id !== bookId));
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (window.confirm(`Confirm purchase for $${totalPrice.toFixed(2)}?`)) {
      try {
        // --- REAL CODE ---
        // await api.post('/orders'); // Backend moves Cart -> Orders

        // --- MOCK CODE ---
        console.log("Placing order...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert("Order placed successfully! Redirecting to your Order History.");
        setCartItems([]); // Clear cart
        navigate('/orders'); // Go to Order History page

      } catch (err) {
        alert("Failed to place order.");
      }
    }
  };

  if (loading) return <p>Loading cart...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Your Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p>Your cart is empty. <a href="/">Go shopping!</a></p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Book</th>
                <th style={{ padding: '10px' }}>Price</th>
                <th style={{ padding: '10px' }}>Quantity</th>
                <th style={{ padding: '10px' }}>Total</th>
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.book_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    <strong>{item.title}</strong><br/>
                    <span style={{ fontSize: '12px', color: '#666' }}>{item.author}</span>
                  </td>
                  <td style={{ padding: '10px' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>{item.quantity}</td>
                  <td style={{ padding: '10px' }}>${(item.price * item.quantity).toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>
                    <button 
                      onClick={() => handleRemove(item.book_id)}
                      style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '30px', textAlign: 'right' }}>
            <h3>Total: ${totalPrice.toFixed(2)}</h3>
            <button 
              onClick={handlePlaceOrder}
              style={{ 
                padding: '15px 30px', 
                fontSize: '16px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}
            >
              Place Order
            </button>
          </div>
        </>
      )}
    </div>
  );
}