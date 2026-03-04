// src/pages/DetailedInsightsPage/components/CommunityValuationAnalysis.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// The component now accepts the propertyId as a prop
const CommunityValuationAnalysis = ({ propertyId }: { propertyId: any }) => {
  const navigate = useNavigate();

  // This function now sends the propertyId and the vote value
  const handleNavigateToRemarks = (vote: string) => {
    navigate('/create-remark', {
      state: {
        propertyId: propertyId,
        vote: vote,
      },
    });
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
        Community Valuation Analysis
      </h3>
      <div>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Have an opinion on this property's valuation? Let us know why.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Each button now calls the handler with its specific vote value */}
          <button className="button-outline" onClick={() => handleNavigateToRemarks('Under-valued')}>
            Under-valued
          </button>
          <button className="button-outline" onClick={() => handleNavigateToRemarks('Fair Value')}>
            Fair Value
          </button>
          <button className="button-outline" onClick={() => handleNavigateToRemarks('Over-valued')}>
            Over-valued
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityValuationAnalysis;