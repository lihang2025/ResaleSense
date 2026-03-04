// src/pages/DetailedInsightsPage/components/ValuationExplanation.tsx
import React from 'react';

interface Explanation {
  feature: string;
  effect: 'increases' | 'decreases';
  value: number;
}

interface ValuationExplanationProps {
  explanation: Explanation[] | null;
}

const ValuationExplanation: React.FC<ValuationExplanationProps> = ({ explanation }) => {
  if (!explanation || explanation.length === 0) {
    return <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading price analysis...</p>;
  }

  // --- THIS IS THE CHANGE: Filter factors into Pros and Cons ---
  const pros = explanation.filter(item => item.effect === 'increases');
  const cons = explanation.filter(item => item.effect === 'decreases');

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Render the Pros section */}
      {pros.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '0.75rem', color: '#16a34a', fontSize: '1rem' }}>Pros (Factors Increasing Price)</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
            {pros.map((item, index) => (
              <li key={`pro-${index}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>🔺 {item.feature}</span>
                <span style={{ color: '#16a34a', fontWeight: '600' }}>
                  + ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Render the Cons section */}
      {cons.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem', color: '#dc2626', fontSize: '1rem' }}>Cons (Factors Decreasing Price)</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
            {cons.map((item, index) => (
              <li key={`con-${index}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>🔻 {item.feature}</span>
                <span style={{ color: '#dc2626', fontWeight: '600' }}>
                  - ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValuationExplanation;