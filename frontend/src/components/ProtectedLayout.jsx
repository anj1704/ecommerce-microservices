import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const ProtectedLayout = () => {
  const token = localStorage.getItem('token');

  // 1. Security Check: If no token, force redirect to Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in, show the Navbar AND the requested page (Outlet)
  return (
    <div>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Outlet /> {/* This renders the child route (Home, Cart, etc.) */}
      </div>
    </div>
  );
};

export default ProtectedLayout;