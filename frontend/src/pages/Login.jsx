import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Login.css';

const API = https://bus-project-i6od.onrender.com/

const Login = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        return;
      }

      // Save auth state
      setAuth(data.user, data.token);

      // Route based on role
      const role = data.user.role;
      if (role === 'driver') navigate('/driver', { replace: true });
      else if (role === 'admin') navigate('/admin', { replace: true });
      else navigate('/passenger', { replace: true });

    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running on port 3001.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-icon">🚌</div>
          <h1>BusTrack</h1>
          <p>Real-Time College Bus Tracking System</p>
        </div>
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">📍</span>
            <div>
              <strong>Live GPS Tracking</strong>
              <p>Track buses in real-time on interactive maps</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⏱️</span>
            <div>
              <strong>Accurate ETA</strong>
              <p>Know exactly when your bus will arrive</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔔</span>
            <div>
              <strong>Instant Alerts</strong>
              <p>Get notified of delays and route changes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-logo">🚌</div>
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-group">
              <label htmlFor="email">
                <span className="field-icon">✉️</span> Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@college.edu"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">
                <span className="field-icon">🔒</span> Password
              </label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="spinner"></span> Signing in...</>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <div className="login-divider"><span>New here?</span></div>

          <Link to="/register" className="goto-register-btn">
            Create an Account
          </Link>

          {/* Demo credentials hint */}
          <div className="demo-creds">
            <p className="demo-title">🧪 Demo Credentials</p>
            <div className="demo-grid">
              <div className="demo-row" onClick={() => setFormData({ email: 'driver1@college.edu', password: 'driver123' })}>
                <span className="demo-role driver">Driver</span>
                <code>driver1@college.edu / driver123</code>
              </div>
              <div className="demo-row" onClick={() => setFormData({ email: 'student1@college.edu', password: 'student123' })}>
                <span className="demo-role student">Student</span>
                <code>student1@college.edu / student123</code>
              </div>
              <div className="demo-row" onClick={() => setFormData({ email: 'admin@college.edu', password: 'admin123' })}>
                <span className="demo-role admin">Admin</span>
                <code>admin@college.edu / admin123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
