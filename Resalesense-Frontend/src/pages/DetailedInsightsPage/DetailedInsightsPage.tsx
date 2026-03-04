// resalesense-frontend/src/pages/DetailedInsightsPage/DetailedInsightsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SinglePropertyView from './components/SinglePropertyView';
import AreaView from './components/AreaView';
import './DetailedInsightsPage.css'; // <-- IMPORT NEW STYLESHEET

// --- Define the Property type ---
// This should match the one in SinglePropertyView
interface Property {
  _id: number; block: string; street_name: string; month: string; resale_price: number;
  town: string; flat_type: string; flat_model: string; floor_area_sqm: number;
  storey_range: string; remaining_lease: string; lease_commence_date: number;
  latitude?: number; longitude?: number; 
}

const DetailedInsightsPage: React.FC = () => {
  // --- State for Data ---
  const [property, setProperty] = useState<Property | null>(null);
  const [areaProperties, setAreaProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Get URL Parameters ---
  const { propertyId, townName } = useParams<{ propertyId?: string; townName?: string }>();

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) return; // Only run if we have a propertyId

      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch the single property's details
        const propertyResponse = await fetch(`http://localhost:4000/api/properties/${propertyId}`);
        if (!propertyResponse.ok) {
          throw new Error(`Property not found (ID: ${propertyId}).`);
        }
        const propertyData: Property = await propertyResponse.json();
        setProperty(propertyData); 

        // 2. Fetch all properties for that town to power the graphs/context
        const areaResponse = await fetch(`http://localhost:4000/api/area/${propertyData.town}`);
        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          setAreaProperties(areaData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false); 
      }
    };

    const fetchAreaData = async () => {
      if (!townName) return; // Only run if we have a townName

      setIsLoading(true);
      setError(null);
      try {
        // Fetch all properties for the specified town
        const areaResponse = await fetch(`http://localhost:4000/api/area/${townName}`);
        if (!areaResponse.ok) {
          throw new Error(`No properties found for area: ${townName}.`);
        }
        const areaData = await areaResponse.json();
        setAreaProperties(areaData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    } else if (townName) {
      fetchAreaData();
    } else {
      setError('No property ID or area name provided.');
      setIsLoading(false);
    }
  }, [propertyId, townName]);

  // --- Render Logic ---

  if (isLoading) {
    // --- UPDATED: Use CSS class ---
    return (
      <div className="page-container">
        <div className="page-loading">Loading insights...</div>
      </div>
    );
  }

  if (error) {
    // --- UPDATED: Use CSS class ---
    return (
      <div className="page-container">
        <div className="page-error">Error: {error}</div>
      </div>
    );
  }

  // If we have a single property, show SinglePropertyView
  if (property) {
    return <SinglePropertyView property={property} areaProperties={areaProperties} />;
  }

  // If we just have area properties (from a /area/:townName link), show AreaView
  if (areaProperties.length > 0 && townName) {
    return <AreaView properties={areaProperties} townName={townName} />;
  }

  // Default fallback
  return <div className="page-container">No data found.</div>;
};

export default DetailedInsightsPage;