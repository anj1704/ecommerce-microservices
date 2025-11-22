import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch the user's Cart (Contains IDs only)
        const cartRes = await api.get(`/cart/${userId}`);
        const rawItems = cartRes.data.items || [];

        // 2. Fetch the Product Catalog (To get Names)
        let productMap = {};
        try {
          // Fetch enough items to cover the IDs
          const productsRes = await api.get('/search?q=book&limit=100');
          const productList = productsRes.data.results || [];
          
          // Create a "Dictionary" for fast lookup
          productList.forEach(p => {
            productMap[p.item_id] = p.description;
          });
        } catch (e) {
          console.warn("Could not fetch catalog for name lookup");
        }

        // 3. Merge them: Cart Item + Real Name
        const enrichedItems = rawItems.map(item => ({
          ...item,
          // LOOKUP: Use the ID to find the name in our map
          caption: productMap[item.itemId] || item.description || `Item #${item.itemId}`,
          // Ensure numbers are numbers
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity)
        }));

        setCartItems(enrichedItems);

        // Calculate Total
        const total = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotalPrice(total);

      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRemove = async (itemId) => {
    const userId = localStorage.getItem('userId');
    try {
      // Optimistic Update (Remove from UI immediately)
      const updatedItems = cartItems.filter(item => item.itemId !== itemId);
      setCartItems(updatedItems);
      
      // Recalculate Total
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setTotalPrice(newTotal);

      // Call Backend to delete
      await api.delete(`/cart/${userId}/remove/${itemId}`);
      
    } catch (err) {
      console.error("Failed to remove item", err);
      alert("Failed to remove item.");
    }
  };

  const handlePlaceOrder = async () => {
    const userId = localStorage.getItem('userId');
    
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (window.confirm(`Confirm purchase for $${totalPrice.toFixed(2)}?`)) {
      try {
        await api.post(`/orders/${userId}/place`);
        
        alert("Order placed successfully!");
        setCartItems([]); 
        navigate('/orders'); 

      } catch (err) {
        console.error("Order failed:", err);
        alert("Failed to place order.");
      }
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '20px' }}>Loading cart...</p>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '20px' }}>Your Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <p style={{ fontSize: '18px' }}>Your cart is empty.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '10px' }}>Go Shopping</button>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '15px', color: '#64748b', fontWeight: '600' }}>Book</th>
                  <th style={{ padding: '15px', color: '#64748b', fontWeight: '600' }}>Price</th>
                  <th style={{ padding: '15px', color: '#64748b', fontWeight: '600' }}>Qty</th>
                  <th style={{ padding: '15px', color: '#64748b', fontWeight: '600' }}>Total</th>
                  <th style={{ padding: '15px', color: '#64748b', fontWeight: '600' }}></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item.itemId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ 
                        maxWidth: '280px', 
                        fontSize: '14px', 
                        color: '#334155',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {/* THIS IS THE FIX: Display the resolved caption */}
                        {item.caption}
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: '#475569' }}>${item.price.toFixed(2)}</td>
                    <td style={{ padding: '15px', color: '#475569' }}>{item.quantity}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <button 
                        onClick={() => handleRemove(item.itemId)}
                        style={{ color: '#ef4444', background: 'none', padding: '0', fontSize: '13px', textDecoration: 'underline' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '30px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' }}>
              Total: ${totalPrice.toFixed(2)}
            </div>
            <button 
              onClick={handlePlaceOrder}
              style={{ padding: '12px 30px', fontSize: '16px' }}
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}