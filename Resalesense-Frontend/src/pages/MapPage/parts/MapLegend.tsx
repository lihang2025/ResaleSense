// resalesense-frontend/src/pages/MapPage/parts/MapLegend.tsx
import React from 'react';
import './MapLegend.css';

interface MapLegendProps {
  minPrice: number;
  maxPrice: number;
}

const MapLegend: React.FC<MapLegendProps> = ({ minPrice, maxPrice }) => {
  // Format numbers to be more readable (e.g., $450K)
  const formatPrice = (price: number) => {
    if (price === 0) return 'N/A';
    return `$${Math.round(price / 1000)}K`;
  };

  return (
    <div className="map-legend card">
      <h4 className="legend-title">Avg. Price (Last 12 Mo.)</h4>
      <div className="legend-gradient"></div>
      <div className="legend-labels">
        <span>{formatPrice(minPrice)}</span>
        <span>{formatPrice(maxPrice)}</span>
      </div>
    </div>
  );
};

export default MapLegend;