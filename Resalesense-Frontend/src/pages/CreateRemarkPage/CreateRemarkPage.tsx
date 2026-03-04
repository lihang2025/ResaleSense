// resalesense-frontend/src/pages/CreateRemarkPage/CreateRemarkPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import './CreateRemarkPage.css';

// Helper to format currency
const formatCurrency = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const CreateRemarkPage: React.FC = () => {
  const [remarkText, setRemarkText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth(); 

  const propertyId = location.state?.propertyId || 0;
  const vote = location.state?.vote || "Not specified";
  const propertyPrice = location.state?.propertyPrice || 0;
  
  const [communityPrice, setCommunityPrice] = useState<number>(propertyPrice);
  const [sliderMin, setSliderMin] = useState<number>(0);
  const [sliderMax, setSliderMax] = useState<number>(0);

  // --- useEffect with smart slider logic ---
 useEffect(() => {
    if (!currentUser) {
        alert('Please log in to create a remark.');
        navigate('/login');
    } else if (currentUser.verificationStatus !== 'verified') {
        alert('Your account must be verified by an administrator to submit valuation remarks.');
        navigate('/'); 
    } else if (!propertyId || !propertyPrice || vote === "Not specified") {
        alert('Missing information. Please start by voting on the property page.');
        navigate('/'); 
    } else {
        // --- CORRECTED Smart Range Logic ---
        let min, max, startValue;

        // 'Over-valued' = List price is TOO HIGH, so suggest a LOWER value.
        if (vote === 'Over-valued') {
            min = Math.floor(propertyPrice * 0.7); // Min is 30% below
            max = propertyPrice;                  // Max is the list price
            startValue = Math.floor(propertyPrice * 0.9); // Start at 10% below
        
        // 'Under-valued' = List price is TOO LOW, so suggest a HIGHER value.
        } else if (vote === 'Under-valued') {
            min = propertyPrice;                  // Min is the list price
            max = Math.floor(propertyPrice * 1.3); // Max is 30% above
            startValue = Math.floor(propertyPrice * 1.1); // Start at 10% above
        
        // "Fair Value" = Suggest a value close to the list price.
        } else {
            min = Math.floor(propertyPrice * 0.9);
            max = Math.floor(propertyPrice * 1.1);
            startValue = propertyPrice; 
        }

        setSliderMin(min);
        setSliderMax(max);
        setCommunityPrice(startValue);
    }
  }, [currentUser, propertyId, propertyPrice, vote, navigate]);
  
  // --- THIS FUNCTION WAS MISSING ---
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommunityPrice(Number(e.target.value));
  };
  // --- END FIX ---

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    if (e.target.value === '') {
      value = sliderMin; 
    }
    const clampedValue = Math.max(sliderMin, Math.min(sliderMax, value));
    setCommunityPrice(clampedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !currentUser) {
      setError("Cannot submit remark. User or property information missing.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('http://localhost:4000/api/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propertyId,
          userId: currentUser.id, 
          text: remarkText,
          valuationVote: vote,
          communityValuation: communityPrice, 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit remark.');
      setSuccess('Remark submitted successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/property/${propertyId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!currentUser || !propertyId || vote === "Not specified") {
      return null;
  }

  return (
    <div className="page-container remark-page-wrapper">
      <div className="card remark-card">
        <h1 className="remark-header">Create a Remark</h1>
        <p className="remark-subheader">
          You voted that this property is "<strong>{vote}</strong>".
        </p>
        <p className="remark-subheader" style={{marginTop: 0}}>
          The listed price was <strong>{formatCurrency(propertyPrice)}</strong>. What do you think is a fair value?
        </p>

        <form onSubmit={handleSubmit} className="remark-form">
          
          <div className="form-group">
            <label htmlFor="communityPrice" className="form-label">
              Your Suggested Fair Value:
            </label>
            <input
              id="communityPrice"
              type="number"
              value={communityPrice}
              onChange={handleNumberChange}
              min={sliderMin}
              max={sliderMax}
              step="1000"
              className="input-field slider-value-input"
            />
            <input
              type="range"
              value={communityPrice}
              onChange={handleSliderChange} // <-- This prop now works
              min={sliderMin}
              max={sliderMax}
              step="1000"
              className="slider-root slider-range-input"
            />
            <div className="slider-labels">
              <span>{formatCurrency(sliderMin)}</span>
              <span>{formatCurrency(sliderMax)}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="remarkText" className="form-label">
              Reason for your valuation (Required):
            </label>
            <textarea
              id="remarkText"
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="Share your thoughts on the property's value..."
              required
              className="input-field"
              rows={4}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <button
            type="submit"
            className="button"
            disabled={currentUser?.verificationStatus !== 'verified'}
          >
            Submit Remark
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRemarkPage;