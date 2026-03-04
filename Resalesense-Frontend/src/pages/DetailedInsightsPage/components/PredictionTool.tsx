// src/pages/DetailedInsightsPage/components/PredictionTool.tsx
import React, { useState, useEffect, useRef } from 'react';
import ValuationExplanation from './ValuationExplanation';

interface Explanation {
  feature: string;
  effect: 'increases' | 'decreases';
  value: number;
}
interface PredictionResponse {
  predictedPrice: number;
  explanation: Explanation[];
  baseValue: number; 
}

const PredictionTool: React.FC<{ propertyId: any }> = ({ propertyId }) => {
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const effectRan = useRef(false);

  useEffect(() => {
    // This logic is sound, no changes needed.
    if (effectRan.current === true) return;
    if (!propertyId) return;

    setIsLoading(true);
    const getPrediction = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const response = await fetch(`http://localhost:4000/api/properties/${propertyId}/predict-range`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startYear: currentYear, endYear: currentYear }),
        });
        if (!response.ok) throw new Error('Prediction request failed');
        const predictionData = await response.json();
        
        if (predictionData && predictionData.length > 0) {
          setData({
            predictedPrice: predictionData[0].predictedPrice,
            explanation: predictionData[0].explanation,
            baseValue: predictionData[0].baseValue,
          });
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Failed to fetch prediction:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getPrediction();
    return () => { effectRan.current = true; };
  }, [propertyId]);

  return (
    <div>
      {/* --- UPDATED: Use CSS classes --- */}
      <h3 className="prediction-header">Valuation Analysis</h3>
      {isLoading && <p>Calculating fair value...</p>}
      {!isLoading && data && (
        <>
          <h4 className="prediction-price">Predicted Fair-Value: ${data.predictedPrice.toLocaleString()}</h4>
          <p className="prediction-base-value">
            Average Predicted Price (Base Value): ${data.baseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <ValuationExplanation explanation={data.explanation} />
        </>
      )}
      {!isLoading && !data && <p style={{ color: 'var(--destructive)' }}>Error: Could not calculate valuation.</p>}
      {/* --- END UPDATE --- */}
    </div>
  );
};

export default PredictionTool;