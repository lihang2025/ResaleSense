// src/components/ComparisonTray.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useComparison } from '../context/ComparisonContext';
import { useAuth } from '../context/AuthContext'; // <-- 1. IMPORT useAuth
import '../styles.css';

// ... (all your style objects are correct) ...
const trayStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '0',
  left: '0',
  width: '100%',
  backgroundColor: '#1f2937',
  color: 'white',
  padding: '1rem',
  boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)',
  zIndex: 1000,
  transform: 'translateY(100%)',
  transition: 'transform 0.3s ease-in-out',
};

const trayVisibleStyle: React.CSSProperties = {
  ...trayStyle,
  transform: 'translateY(0)',
};


const ComparisonTray: React.FC = () => {
  const { properties, removeProperty, clearProperties } = useComparison();
  const { isAuthLoading } = useAuth(); // <-- 2. GET isAuthLoading

  // --- 3. ADD/UPDATE CONSOLE LOGS ---
  console.log('ComparisonTray sees properties:', properties);
  console.log('ComparisonTray sees isAuthLoading:', isAuthLoading); // <-- ADD THIS

  if (properties.length === 0) {
    return null;
  }
  
  // ... (the rest of your JSX return is perfectly fine, no changes needed) ...
  return (
    <div style={trayVisibleStyle}>
      <div className="page-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Comparison Basket ({properties.length}/3)</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {properties.map(p => (
              <div key={p._id} style={{ backgroundColor: '#4b5563', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                <span>{p.block} {p.street_name}</span>
                <button onClick={() => removeProperty(p._id)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#fecaca', cursor: 'pointer' }}>
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/compare" className="button">Compare</Link>
          <button onClick={clearProperties} className="button-outline" style={{ borderColor: '#9ca3af', color: '#d1d5db' }}>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTray;