import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  // FIX 1: Change 'username' to 'email' to match Backend requirement
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Helper to safely extract User ID
  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Login request now sends { email, password }
      const response = await api.post('/auth/login', credentials);
      
      const token = response.data.access_token;
      
      // Smart ID Extraction (from response OR token)
      let userId = response.data.user?.user_id;
      if (!userId) {
        const decoded = parseJwt(token);
        userId = decoded?.user_id || decoded?.sub;
      }

      if (!userId) throw new Error("Missing User ID");

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);

      navigate('/');
      
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      // Show specific error if available
      setError(err.response?.data?.detail || 'Login failed.');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2 style={{ textAlign: 'center' }}>Welcome Back</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* FIX 2: Input is now Email */}
        <input
          type="email"
          placeholder="Email Address"
          value={credentials.email}
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          required
        />
        <button type="submit">Login</button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}