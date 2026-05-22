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
        setError(data.error || 'Connexion échouée');
      }

    } catch (err) {
      setError('Erreur du serveur. Veuillez réessayer.');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h2>Bienvenue</h2>
        <p className="login-sub">Connecte-toi à ton compte pour continuer</p>

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
            <label>Mot de passe</label>
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
            <span onClick={() => navigate('/forgot-password')}>Mot de passe oublié?</span>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <p className="login-switch">
          Tu n'as pas de compte?{' '}
          <span onClick={() => navigate('/register')}>S'inscrire</span>
        </p>

      </div>
    </div>
  );
};

export default Login;