import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Styles for the Navbar container
  const navStyle = {
    backgroundColor: '#1e293b', // Dark Slate
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  // Styles for individual links
  const linkStyle = {
    color: '#e2e8f0',
    textDecoration: 'none',
    marginLeft: '20px',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'color 0.2s'
  };

  const brandStyle = {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <nav style={navStyle}>
      {/* Brand / Logo - Changed to Generic Store Name */}
      <Link to="/" style={brandStyle}>
        🛍️ CloudMart
      </Link>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={linkStyle}>Shop</Link> {/* Changed "Home" to "Shop" */}
        <Link to="/cart" style={linkStyle}>🛒 Cart</Link>
        <Link to="/orders" style={linkStyle}>Orders</Link>

        {isLoggedIn ? (
          <button 
            onClick={handleLogout} 
            style={{ 
              marginLeft: '20px', 
              backgroundColor: '#ef4444', // Red for logout
              padding: '6px 12px', 
              fontSize: '14px' 
            }}
          >
            Logout
          </button>
        ) : (
          <div style={{ marginLeft: '20px', borderLeft: '1px solid #475569', paddingLeft: '20px' }}>
             <Link to="/login" style={{ ...linkStyle, marginLeft: 0 }}>Login</Link>
             <Link to="/register" style={linkStyle}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;