import { useState, useEffect } from 'react';
import api from '../api'; // ✅ ADDED: You need this to fetch data

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // ✅ REAL CODE
        const response = await api.get('/orders');
        setOrders(response.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '20px' }}>Loading your orders...</p>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '20px' }}>Your Order History</h2>

      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ✅ FIX: Added the map over 'orders' here */}
          {orders.map(order => (
            <div key={order.order_id} className="card" style={{ padding: '25px' }}>
              
              {/* ✅ ADDED: The Order Header (ID, Date, Total) was missing */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0', 
                paddingBottom: '15px', 
                marginBottom: '15px' 
              }}>
                <div>
                  <strong style={{ fontSize: '18px', color: '#1e293b' }}>Order #{order.order_id}</strong>
                  <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{order.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Total</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>
                    ${order.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#334155', alignItems: 'flex-start' }}>
                    
                    {/* Left side: Quantity + Caption */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontWeight: '600', minWidth: '20px' }}>{item.quantity}x</span>
                      
                      {/* Caption with truncation */}
                      <span style={{ 
                        maxWidth: '400px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                        color: '#475569'
                      }}>
                        {item.caption || "Item description unavailable"}
                      </span>
                    </div>

                    {/* Right side: Price */}
                    <span style={{ whiteSpace: 'nowrap' }}>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
            </div>
          ))}
          
        </div>
      )}
    </div>
  );
}