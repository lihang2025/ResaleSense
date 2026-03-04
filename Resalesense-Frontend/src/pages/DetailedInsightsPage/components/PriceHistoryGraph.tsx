// src/pages/DetailedInsightsPage/components/PriceHistoryGraph.tsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter,
} from 'recharts';

interface DataPoint { year: number; price: number; }
interface PredictionDataPoint { year: number; predictedPrice: number; }

// --- UPDATED: Added title prop ---
interface PriceHistoryGraphProps {
  historyData: DataPoint[];
  predictionData: PredictionDataPoint[];
  title: string; // <-- NEW
}

const PriceHistoryGraph: React.FC<PriceHistoryGraphProps> = ({ historyData, predictionData, title }) => {
  // --- FIX: Dynamic 5-year domain ---
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;

  const allYears = Array.from(new Set([...historyData.map(d => d.year), ...predictionData.map(p => p.year)])).sort();

  const combinedData = allYears.map(year => {
    const historyPoint = historyData.find(h => h.year === year);
    const predictionPoint = predictionData.find(p => p.year === year);
    return {
      year,
      'Average Price': historyPoint ? historyPoint.price : null,
      'Predicted Price': predictionPoint ? predictionPoint.predictedPrice : null,
    };
  });

  const isTrend = historyData.length > 1;

  return (
    <div>
      {/* --- UPDATED: Use dynamic title --- */}
      <h3 className="prediction-header">{title}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              type="number"
              domain={[startYear, currentYear]}
              tickCount={6} 
              tickFormatter={(tick) => tick.toString()}
            />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              labelFormatter={(label) => `Year: ${label}`}
              formatter={(value: number, name: string) => {
                if (value === null) return null;
                return [`$${Math.round(value).toLocaleString()}`, name];
              }}
            />
            <Legend />
            {isTrend ? (
              <Line dataKey="Average Price" stroke="#8884d8" strokeWidth={2} type="monotone" connectNulls />
            ) : (
              <Scatter name="Average Price" dataKey="Average Price" fill="#8884d8" />
            )}
            {predictionData.length > 0 && (
              <Line dataKey="Predicted Price" stroke="#82ca9d" strokeWidth={2} type="monotone" connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryGraph;