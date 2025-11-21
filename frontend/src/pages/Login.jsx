import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // --- REAL BACKEND CODE (Keep this commented out) ---
      // const response = await api.post('/login', credentials);
      // const token = response.data.access_token; 

      // --- FAKE MOCK CODE ---
      console.log("Simulating Login for:", credentials);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
      
      // Create a fake token
      const token = "fake-jwt-token-123456789"; 

      // Save it just like the real app would
      localStorage.setItem('token', token);

      navigate('/');
      
    } catch (err) {
      setError('Invalid username or password');
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Welcome to BookShop</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Username"
          value={credentials.username}
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          required
          style={{ padding: '10px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          required
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
          Login
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}