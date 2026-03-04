// resalesense-frontend/src/pages/LoginPage/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css'; // This file is also used by RegisterPage

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // --- THIS IS THE UPDATED LOGIC ---
        if (data.error === 'ACCOUNT_BANNED') {
          // If it's a ban, we use the detailed message from the backend
          // which includes the expiry date.
          throw new Error(data.message);
        } else {
          // Otherwise, use the generic error or default.
          throw new Error(data.error || 'Login failed');
        }
        // --- END UPDATED LOGIC ---
      }

      login(data.user); // Store user in context
      
      // The navigation fix
      navigate('/map'); 

    } catch (err: any) {
      // This will now show the full ban message (e.g., "...expires on [DATE]")
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-welcome-header">
        Welcome back to <span>ResaleSense!</span>
      </div>
      
      <div className="login-card card">
        <h2>Log In</h2>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            // The error message (including the ban expiry) will appear here
            <p style={{ color: 'var(--destructive)', textAlign: 'center', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            />
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="signup-link-text">
          Don't have an account?{' '}
          <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;