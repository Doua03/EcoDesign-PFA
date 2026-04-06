import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',           // ← sends session cookie
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user info in localStorage for easy access
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/app');                 // ← redirect to the main app
      } else {
        setError(data.error || 'Login failed');
      }

    } catch (err) {
      setError('Server error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h2>Welcome back</h2>
        <p className="login-sub">Log in to your account to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="login-forgot">
            <span onClick={() => navigate('/forgot-password')}>Forgot password?</span>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="login-switch">
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')}>Sign up</span>
        </p>

      </div>
    </div>
  );
};

export default Login;