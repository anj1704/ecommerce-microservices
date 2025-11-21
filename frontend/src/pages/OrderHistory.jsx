import { useState, useEffect } from 'react';
// import api from '../api'; // Keep for later

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MOCK DATA (What the "Past Orders Service" would send) ---
  const MOCK_ORDERS = [
    {
      order_id: 101,
      date: '2025-11-15',
      total: 85.50,
      status: 'DELIVERED',
      items: [
        { title: 'Designing Data-Intensive Apps', quantity: 1, price: 35.50 },
        { title: 'Cloud Computing', quantity: 1, price: 50.00 }
      ]
    },
    {
      order_id: 102,
      date: '2025-11-18',
      total: 42.00,
      status: 'SHIPPED',
      items: [
        { title: 'Clean Code', quantity: 1, price: 42.00 }
      ]
    }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // --- REAL CODE ---
        // const response = await api.get('/orders');
        // setOrders(response.data);

        // --- MOCK CODE ---
        console.log("Fetching order history...");
        await new Promise(resolve => setTimeout(resolve, 500));
        setOrders(MOCK_ORDERS);

      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading your orders...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Your Order History</h2>

      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => (
            <div key={order.order_id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <strong>Order #{order.order_id}</strong>
                  <span style={{ marginLeft: '15px', color: '#666', fontSize: '14px' }}>{order.date}</span>
                </div>
                <div>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    background: order.status === 'DELIVERED' ? '#d4edda' : '#fff3cd',
                    color: order.status === 'DELIVERED' ? '#155724' : '#856404'
                  }}>
                    {order.status}
                  </span>
                  <strong style={{ marginLeft: '15px' }}>${order.total.toFixed(2)}</strong>
                </div>
              </div>

              {/* Order Items List */}
              <div>
                {order.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '5px 0' }}>
                    <span>{item.quantity}x {item.title}</span>
                    <span>${item.price.toFixed(2)}</span>
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