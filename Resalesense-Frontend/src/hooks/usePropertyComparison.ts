// src/hooks/usePropertyComparison.ts
import { useState, useEffect } from 'react';

// Define the shape of the properties we'll be working with
interface PropertyStub {
  _id: number;
}

// --- UPDATED: This interface now matches the full data from the API ---
export interface DetailedProperty extends PropertyStub {
  resale_price: number;
  town: string; // <-- Was missing
  flat_type: string;
  floor_area_sqm: number;
  storey_range: string;
  remaining_lease: string;
  block: string;
  street_name: string;
  lease_commence_date: number; // <-- Was missing (caused the error)
  latitude?: number;           // <-- Was missing
  longitude?: number;          // <-- Was missing
  predictedPrice?: number;
  isPredicting?: boolean;
}
// --- END UPDATE ---

/**
 * Custom hook to manage fetching and processing of properties for comparison.
 * @param properties - The initial array of properties from the comparison context.
 * @returns An object with the detailed properties, loading state, and error state.
 */
export const usePropertyComparison = (properties: PropertyStub[]) => {
  const [detailedProperties, setDetailedProperties] = useState<DetailedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect 1: Fetch initial property details when the context properties change.
  useEffect(() => {
    if (properties.length === 0) {
      setIsLoading(false);
      setDetailedProperties([]);
      return;
    }

    const fetchInitialDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ids = properties.map(p => p._id);
        const response = await fetch('http://localhost:4000/api/properties/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) throw new Error('Failed to fetch property details.');
        
        // This 'data' variable now correctly matches the DetailedProperty type
        const data: DetailedProperty[] = await response.json();
        
        // This logic is unchanged
        const sortedData = ids.map(id => {
          const propertyData = data.find(d => d._id === id);
          // Add isPredicting flag
          return { ...propertyData!, isPredicting: true }; 
        });
        setDetailedProperties(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialDetails();
  }, [properties]);

  // Effect 2: Fetch predictions (Unchanged)
  useEffect(() => {
    // Only run if we have properties and they are marked for prediction.
    if (detailedProperties.length === 0 || !detailedProperties[0].isPredicting) return;

    const fetchAllPredictions = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const predictionPromises = detailedProperties.map(prop =>
          fetch(`http://localhost:4000/api/properties/${prop._id}/predict-range`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startYear: currentYear, endYear: currentYear }),
          }).then(res => res.json())
        );

        const predictionResults = await Promise.all(predictionPromises);

        setDetailedProperties(currentProps =>
          currentProps.map((prop, index) => ({
            ...prop,
            predictedPrice: predictionResults[index][0]?.predictedPrice,
            isPredicting: false,
          }))
        );
      } catch (predError) {
        console.error("Failed to fetch predictions:", predError);
        // Stop loading state on error
        setDetailedProperties(currentProps =>
          currentProps.map(p => ({ ...p, isPredicting: false })) 
        );
      }
    };

    fetchAllPredictions();
  }, [detailedProperties]);

  return { detailedProperties, isLoading, error };
};