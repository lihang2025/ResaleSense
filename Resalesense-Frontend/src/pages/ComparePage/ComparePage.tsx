// src/pages/ComparePage/ComparePage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useComparison } from '../../context/ComparisonContext';
import { usePropertyComparison, DetailedProperty } from '../../hooks/usePropertyComparison';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ComparePage.css'; 
import PredictionTool from '../DetailedInsightsPage/components/PredictionTool'; 
import CommunityValuationDisplay from '../DetailedInsightsPage/components/CommunityValuationDisplay';

// Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Interfaces
interface MappableProperty { latitude?: number; longitude?: number; }
interface ValuationData {
  propertyId: number;
  average: number | null;
  count: number | null;
}

// --- 1. FIX: Added 'return null' to MapBoundsUpdater ---
const MapBoundsUpdater: React.FC<{ properties: MappableProperty[] }> = ({ properties }) => {
    const map = useMap();
    useEffect(() => {
        const validProperties = properties.filter(p => p.latitude && p.longitude);
        if (validProperties.length > 0) {
            const bounds = new L.LatLngBounds(validProperties.map(p => [p.latitude!, p.longitude!]));
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            map.setView([1.3521, 103.8198], 12);
        }
    }, [properties, map]);
    return null; // <-- This fixes the 'void' type error
};

// --- 2. FIX: Added MapCleanup component ---
const MapCleanup: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    return () => {
      map.remove();
    };
  }, [map]);
  return null;
};
// --- END FIXES ---

const ComparePage: React.FC = () => {
  const { properties: contextProperties, removeProperty } = useComparison();
  const { detailedProperties, isLoading, error } = usePropertyComparison(contextProperties);

  const [valuationData, setValuationData] = useState<ValuationData[]>([]);
  const [isValuationLoading, setIsValuationLoading] = useState(true);

  useEffect(() => {
    if (detailedProperties && detailedProperties.length > 0) {
      const fetchAllValuations = async () => {
        setIsValuationLoading(true);
        try {
          const promises = detailedProperties.map(prop => 
            fetch(`http://localhost:4000/api/remarks/average/${prop._id}`)
              .then(res => res.ok ? res.json() : Promise.resolve({ average: null, count: null }))
              .then(data => ({
                propertyId: prop._id,
                average: data.average,
                count: data.count
              }))
              .catch(() => ({ // Catch individual fetch errors
                propertyId: prop._id,
                average: null,
                count: null
              }))
          );
          
          const results = await Promise.all(promises);
          setValuationData(results);

        } catch (err) {
          console.error("Failed to fetch community valuations", err);
          // Set all to null
          setValuationData(detailedProperties.map(p => ({
            propertyId: p._id, average: null, count: null
          })));
        } finally {
          setIsValuationLoading(false);
        }
      };

      fetchAllValuations();
    } else {
      // Clear data if properties are empty
      setValuationData([]);
      setIsValuationLoading(false);
    }
  }, [detailedProperties]); // Re-run when properties change


  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return <div className="page-container page-loading">Loading comparison data...</div>;
  }
  
  if (error) {
    return <div className="page-container page-error">Error: {error}</div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Compare Properties</h1>
      
      {detailedProperties.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Your comparison basket is empty.</p>
        </div>
      ) : (
        <>
          <div className="compare-map-container">
            <MapContainer
              key={JSON.stringify(detailedProperties.map(p => p._id))}
              center={[1.3521, 103.8198]} zoom={12} style={{ height: "100%", width: "100%" }}
            >

              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {detailedProperties
                .filter(prop => prop && prop.latitude && prop.longitude)
                .map(prop => (
                  <Marker key={prop._id} position={[prop.latitude!, prop.longitude!]}>
                    <Popup>
                      {prop.block} {prop.street_name} <br/> {formatCurrency(prop.resale_price)}
                    </Popup>
                  </Marker>
                )
              )}
              <MapBoundsUpdater properties={detailedProperties} />
            </MapContainer>
          </div>

          <div className="compare-grid">
            {detailedProperties.map((prop) => {
              const valuation = valuationData.find(v => v.propertyId === prop._id);

              return (
                <div key={prop._id} className="card compare-card">
                  <div className="compare-card-header">
                    <h3>{prop.block} {prop.street_name}</h3>
                  </div>
                  
                  <div className="compare-card-body">
                    <p><strong>Price:</strong> {formatCurrency(prop.resale_price)}</p>
                    <p><strong>Town:</strong> {prop.town}</p>
                    <p><strong>Flat Type:</strong> {prop.flat_type}</p>
                    <p><strong>Area:</strong> {prop.floor_area_sqm} sqm</p>
                    <p><strong>Storey:</strong> {prop.storey_range}</p>
                    <p><strong>Lease:</strong> {prop.remaining_lease}</p>
                    
                    <div className="compare-section-divider">
                      <h4 className="compare-section-title">Community Valuation</h4>
                      <CommunityValuationDisplay
                        listPrice={prop.resale_price}
                        communityPrice={valuation?.average || null}
                        voteCount={valuation?.count || null}
                        isLoading={isValuationLoading}
                      />
                    </div>
                    
                    <div className="compare-section-divider" style={{paddingBottom: 0, borderBottom: 'none'}}>
                      <h4 className="compare-section-title">AI Prediction</h4>
                      <PredictionTool propertyId={prop._id} />
                    </div>
                  </div>

                  <div className="compare-card-footer">
                    <Link to={`/property/${prop._id}`} className="button-outline">
                      View Full Details &rarr;
                    </Link>
                    <button onClick={() => removeProperty(prop._id)} className="button-destructive">
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/" className="button">Back to Search</Link>
      </div>
    </div>
  );
};

export default ComparePage;