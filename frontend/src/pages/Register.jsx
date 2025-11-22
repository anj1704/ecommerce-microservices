import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link import
import api from '../api';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ REAL BACKEND CODE (Active)
      await api.post('/register', formData);
      
      alert('Registration successful! Please login.');
      navigate('/login');
      
    } catch (err) {
      // Improved error handling to see what the server says
      console.error("Registration Error:", err.response?.data || err.message);
      setError('Registration failed. ' + (err.response?.data?.detail || 'Try a different username.'));
    }
  };

  return (
    // Added container styling to center the box
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Create an Account</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          style={{ padding: '10px' }}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          style={{ padding: '10px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          style={{ padding: '10px' }}
        />
        {/* Changed button color to Blue to distinguish from Login */}
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          Register
        </button>
      </form>

      {/* Added Link to switch back to Login */}
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}