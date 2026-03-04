import React from 'react';

// --- NEW: Updated interface to match new data structure ---
interface Amenity {
  name: string;
  type: string;
  distance: string;
  lat: number;
  lon: number;
}

interface NearbyAmenitiesProps {
  amenities: Amenity[] | null;
  isLoading: boolean;
  error: string | null;
}

const NearbyAmenities: React.FC<NearbyAmenitiesProps> = ({ amenities, isLoading, error }) => {
  return (
    <div className="card">
      <h3 className="prediction-header">Nearby Amenities (within 500m)</h3>
      {isLoading && <p>Loading amenities...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* --- UPDATED: Render logic from prop --- */}
      {!isLoading && !error && amenities && amenities.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {amenities.map((amenity) => (
            <li key={amenity.name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <span>{amenity.name} ({amenity.type})</span>
              <span style={{ fontWeight: '600' }}>{amenity.distance}</span>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !error && (!amenities || amenities.length === 0) && (
        <p className="comment-info-box" style={{border: 'none', padding: 0, margin: 0}}>
          No amenities found within 500m.
        </p>
      )}
      {/* --- END UPDATE --- */}
    </div>
  );
};

export default NearbyAmenities;