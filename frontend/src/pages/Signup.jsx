import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registered successfully!');
        navigate('/login'); // ✅ redirect
      } else {
        setError(data.error || 'Registration failed');
      }

    } catch (err) {
      setError('Server error');
    }

    setLoading(false);
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Welcome back</h2>
        <p className="signup-sub">Create an account to continue</p>
        <form onSubmit={handleSubmit}>
         <div className="signup-field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
         </div>    
        
        <div className="signup-field">
          <label>Username</label>
          <input
            type="text"
            name="name"
            placeholder="Username"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="signup-field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

        </div>
          <label className="checkbox-label">
            <input type="checkbox" required />
            I agree to the terms and conditions
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit"  className="signup-btn" disabled={loading}>
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <p className="signup-switch">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default Signup;