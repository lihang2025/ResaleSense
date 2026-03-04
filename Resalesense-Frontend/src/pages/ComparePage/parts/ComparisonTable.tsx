// src/pages/ComparePage/parts/ComparisonTable.tsx
import React from 'react';
import type { DetailedProperty } from '../../../hooks/usePropertyComparison';

// Helper to render the cell content based on its key
const renderCellContent = (prop: DetailedProperty, key: string) => {
  if (key === 'resale_price') {
    return `$${prop.resale_price.toLocaleString()}`;
  }
  if (key === 'predictedPrice') {
    if (prop.isPredicting) return <em>Calculating...</em>;
    if (prop.predictedPrice) return `$${prop.predictedPrice.toLocaleString()}`;
    return <span style={{ color: 'red' }}>Error</span>;
  }
  return prop[key as keyof DetailedProperty];
};

const attributesToShow = [
  { key: 'resale_price', label: 'Last Sold Price' },
  { key: 'predictedPrice', label: 'Predicted Fair-Value' },
  { key: 'town', label: 'Town' },
  { key: 'flat_type', label: 'Flat Type' },
  { key: 'floor_area_sqm', label: 'Floor Area (sqm)' },
  { key: 'storey_range', label: 'Storey' },
  { key: 'remaining_lease', label: 'Remaining Lease' },
];

interface ComparisonTableProps {
  properties: DetailedProperty[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ properties }) => {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid #e5e7eb' }}>Feature</th>
            {properties.map(prop => (
              <th key={prop._id} style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid #e5e7eb' }}>
                {prop.block} {prop.street_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attributesToShow.map(attr => (
            <tr key={attr.key}>
              <td style={{ fontWeight: 'bold', padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>{attr.label}</td>
              {properties.map(prop => (
                <td key={prop._id} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  {renderCellContent(prop, attr.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;