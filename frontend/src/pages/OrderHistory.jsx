import { useState, useEffect } from "react";
import api from "../api";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        // 1. Fetch the raw orders
        const ordersRes = await api.get(`/orders/${userId}`);
        const rawOrders = ordersRes.data;

        // 2. Fetch products to lookup the names (So video looks good!)
        // We get a list of all items to match IDs to Captions
        let productMap = {};
        try {
          const productsRes = await api.get("/search?q=item&limit=100");
          const productList = productsRes.data.results || [];
          // Create a dictionary: { "1": "Cloud Computing...", "2": "Clean Code..." }
          productList.forEach((p) => {
            productMap[p.item_id] = p.description;
          });
        } catch (e) {
          console.warn("Could not fetch product details for history");
        }

        // 3. Process the Orders (Fixing the Crash)
        const safeOrders = rawOrders.map((order) => {
          let parsedItems = [];

          // FIX A: Handle "items" being a JSON string or an Array
          if (typeof order.items === "string") {
            try {
              parsedItems = JSON.parse(order.items);
            } catch (e) {
              console.error("Failed to parse items JSON", e);
            }
          } else if (Array.isArray(order.items)) {
            parsedItems = order.items;
          }

          // FIX B: Map IDs to Captions
          const enrichedItems = parsedItems.map((item) => ({
            ...item,
            // Use the map we built, or fallback to the ID
            caption:
              productMap[item.itemId || item.item_id] ||
              item.description ||
              `Item #${item.itemId}`,
          }));

          return {
            ...order,
            items: enrichedItems,
            // FIX C: Handle 'total_amount' vs 'total'
            total:
              order.total_amount !== undefined
                ? parseFloat(order.total_amount)
                : parseFloat(order.total || 0),
          };
        });

        setOrders(safeOrders);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Loading your orders...
      </p>
    );

  return (
    <div className="container" style={{ maxWidth: "800px" }}>
      <h2 style={{ marginBottom: "20px" }}>Your Order History</h2>

      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="card"
              style={{ padding: "25px" }}
            >
              {/* Order Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "18px", color: "#1e293b" }}>
                    Order #{order.order_id}
                  </strong>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  >
                    {/* Handle Date formatting safely */}
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : order.date}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    Total
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#0f172a",
                    }}
                  >
                    {/* Safe Number Formatting */}${order.total?.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                      color: "#334155",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontWeight: "600", minWidth: "20px" }}>
                        {item.quantity}x
                      </span>

                      <span
                        style={{
                          maxWidth: "400px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "inline-block",
                          color: "#475569",
                        }}
                      >
                        {item.caption}
                      </span>
                    </div>

                    <span style={{ whiteSpace: "nowrap" }}>
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
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

