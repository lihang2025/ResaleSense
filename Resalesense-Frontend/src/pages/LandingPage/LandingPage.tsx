// resalesense-frontend/src/pages/LandingPage/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { Search, TrendingUp, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-wrapper">
      
      {/* Container for main content (Hero + Features) */}
      <div className="landing-container">
        
        {/* --- Hero Section --- */}
        <div className="hero-section">
          <h1 className="hero-title">ResaleSense</h1>
          <p className="hero-subtitle">
            Find Your Perfect HDB Home with AI-Powered Insights
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="button-landing button-solid">
              Get Started Free
            </Link>
            <Link to="/login" className="button-landing button-outline-white">
              Login
            </Link>
            <Link to="/map" className="button-landing button-outline-white">
              Continue as Guest
            </Link>
          </div>
        </div>

        {/* --- Features Section --- */}
        <div className="features-grid">
          <div className="feature-card">
            <Search size={32} className="feature-icon" />
            <h3 className="feature-title">Smart Search</h3>
            <p className="feature-text">
              Find properties by location, price, and amenities with our advanced filters
            </p>
          </div>
          <div className="feature-card">
            <TrendingUp size={32} className="feature-icon" />
            <h3 className="feature-title">Price Predictions</h3>
            <p className="feature-text">
              Get AI-powered future price estimates to make informed decisions
            </p>
          </div>
          <div className="feature-card">
            <Users size={32} className="feature-icon" />
            <h3 className="feature-title">Community Insights</h3>
            <p className="feature-text">
              See what others think about properties and valuations
            </p>
          </div>
        </div>
      </div>

      {/* --- Footer Section (MOVED OUTSIDE .landing-container) --- */}
      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} ResaleSense. All rights reserved.
        </p>
        <div className="footer-links">
          <Link to="/terms" className="footer-link">
            Terms and Conditions
          </Link>
          {/* "Privacy Policy" link has been removed */}
          <Link to="/faq" className="footer-link">
            FAQ
          </Link>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;