import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import ProtectedLayout from './components/ProtectedLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES (No Navbar) --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- PROTECTED ROUTES (Has Navbar) --- */}
        {/* Any route inside here is guarded by ProtectedLayout */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<ProductList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrderHistory />} />
        </Route>

        {/* Fallback: Any unknown URL redirects to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;