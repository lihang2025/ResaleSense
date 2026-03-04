// src/pages/RegisterPage/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Label from '@radix-ui/react-label';

// Import CSS files
import './RegisterPage.css';
import '../LoginPage/LoginPage.css';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // <-- Add isLoading state
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true); // <-- Set loading true

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false); // <-- Stop loading on mismatch
      return;
    }

    // Basic password validation
    if (password.length < 6) {
         setError("Password must be at least 6 characters long.");
         setIsLoading(false);
         return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send name, email, password (contactNumber is optional, add if needed)
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // --- UPDATED ERROR HANDLING ---
        // Check if the backend sent a 409 Conflict status (duplicate)
        if (response.status === 409) {
          // Use the specific error message from the backend
          throw new Error(data.error || 'Username or email already exists.');
        } else {
          // Handle other errors
          throw new Error(data.error || 'Registration failed. Please check your input.');
        }
        // --- END UPDATED ERROR HANDLING ---
      }

      // On successful registration, show message and navigate to login
      alert(data.message || "Registration successful! Please log in.");
      navigate('/login');

    } catch (err: any) {
      // Set the error state to display the specific message caught
      setError(err.message);
      console.error("Registration Error:", err);
    } finally {
        setIsLoading(false); // <-- Set loading false
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="card login-card">
        <h2 className="register-title">Create an account</h2>
        <p className="register-subtitle">Join ResaleSense and start your journey</p>
        <form onSubmit={handleRegister} className="login-form">
          {/* Display error message */}
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

          {/* Name Field */}
          <div className="form-group">
            <Label.Root className="form-label" htmlFor="name">
              Username
            </Label.Root>
            <input
              id="name"
              type="text"
              placeholder="Choose a username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
              disabled={isLoading} // Disable input while loading
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <Label.Root className="form-label" htmlFor="email">
              Email
            </Label.Root>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              disabled={isLoading} // Disable input while loading
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <Label.Root className="form-label" htmlFor="password">
              Password
            </Label.Root>
            <input
              id="password"
              type="password"
              placeholder="Minimum 6 characters" // Added hint
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              disabled={isLoading} // Disable input while loading
            />
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <Label.Root className="form-label" htmlFor="confirm-password">
              Confirm Password
            </Label.Root>
            <input
              id="confirm-password"
              type="password"
              placeholder="Re-enter password" // Added hint
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field"
              disabled={isLoading} // Disable input while loading
            />
          </div>

          {/* Update button text and disable state */}
          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p className="login-link-text">
          Already have an account?{' '}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;