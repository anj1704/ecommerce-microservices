import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  // Simple check: do we have a token?
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{ padding: '15px', borderBottom: '1px solid #ddd', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <Link to="/" style={{ marginRight: '15px', fontWeight: 'bold' }}>📚 BookShop</Link>
        <Link to="/cart" style={{ marginRight: '15px' }}>🛒 Cart</Link>
        <Link to="/orders">📦 Orders</Link>
      </div>

      <div>
        {isLoggedIn ? (
          <button onClick={handleLogout} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'blue', textDecoration: 'underline' }}>
            Logout
          </button>
        ) : (
          <>
             <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
             <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;