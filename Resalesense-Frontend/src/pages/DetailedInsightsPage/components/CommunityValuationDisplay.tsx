import React from 'react';
import './CommunityValuationDisplay.css'; 

// ... (formatCurrency helper remains the same)
const formatCurrency = (value: number, showSign = false) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  };
  if (showSign) {
    options.signDisplay = 'always';
  }
  return new Intl.NumberFormat('en-US', options).format(value);
};

interface CommunityValuationDisplayProps {
  listPrice: number;
  communityPrice: number | null; // This is the 'average'
  voteCount: number | null;      // This is the 'count'
  isLoading: boolean;
}

const CommunityValuationDisplay: React.FC<CommunityValuationDisplayProps> = ({
  listPrice,
  communityPrice,
  voteCount,
  isLoading,
}) => {
  if (isLoading) {
    return <p className="valuation-loading">Loading community average...</p>;
  }

  // --- 1. THIS IS THE LOGIC FIX ---
  // State 1: No valuation votes at all.
  if (voteCount === 0 || !voteCount) {
    return (
      <div className="valuation-display neutral">
        <div className="valuation-delta">Be the first to vote!</div>
        <p className="valuation-subheader">
          Your vote will help establish a community average.
        </p>
      </div>
    );
  }

  // State 2: Votes exist, but no average (e.g., only area comments, which we now filter)
  // This state is now less likely but good to keep.
  if (!communityPrice) {
    return (
      <div className="valuation-display neutral">
        <div className="valuation-delta">Not Enough Valuation Data</div>
        <p className="valuation-subheader">
          Based on {voteCount} {voteCount === 1 ? 'vote' : 'votes'}.
        </p>
      </div>
    );
  }
  // --- END LOGIC FIX ---


  // State 3: Full display (Average and Count exist)
  const delta = communityPrice - listPrice;
  const percentageDelta = (delta / listPrice);
  let statusText = 'Fair Value';
  let statusClass = 'fair-value';

  if (percentageDelta > 0.01) { 
    statusText = 'Under-valued';
    statusClass = 'under-valued';
  } else if (percentageDelta < -0.01) {
    statusText = 'Over-valued';
    statusClass = 'over-valued';
  }

  return (
    <div className={`valuation-display ${statusClass}`}>
      <div className="valuation-delta">
        <span className="status-text">{statusText}</span>
        <span className="delta-amount">{formatCurrency(delta, true)}</span>
      </div>
      <div className="valuation-prices">
        <div>
          <span>List Price</span>
          <strong>{formatCurrency(listPrice)}</strong>
        </div>
        <div>
          <span>Community Avg.</span>
          <strong>{formatCurrency(communityPrice)}</strong>
          <span className="vote-count">(based on {voteCount} {voteCount === 1 ? 'vote' : 'votes'})</span>
        </div>
      </div>
    </div>
  );
};

export default CommunityValuationDisplay;