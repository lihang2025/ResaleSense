// src/context/ComparisonContext.tsx
import React, { useState, useContext, createContext, ReactNode } from 'react';

// --- 1. Define the shape of our data ---
// This interface describes a single property object.
interface Property {
  _id: number;
  block: string;
  street_name: string;
  // Add any other property fields you want to access in the comparison tray
}

// This interface describes the data and functions our Context will provide.
interface ComparisonContextType {
  properties: Property[];
  addProperty: (property: Property) => void;
  removeProperty: (propertyId: number) => void;
  clearProperties: () => void;
}

// --- 2. Create the Context with a default value ---
const ComparisonContext = createContext<ComparisonContextType>(null!);

// --- 3. Create a custom hook for easy access ---
export const useComparison = () => {
  return useContext(ComparisonContext);
};

// --- 4. Create the Provider Component ---
export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  
  // --- UPDATED: Changed from 4 to 3 ---
  const MAX_COMPARE = 3; 

  // Function to add a property to the comparison list
  const addProperty = (property: Property) => {
    // Prevent adding duplicates or exceeding the max limit
    if (properties.length < MAX_COMPARE && !properties.some(p => p._id === property._id)) {
      setProperties(prev => [...prev, property]);
    } else if (properties.length >= MAX_COMPARE) {
      alert(`You can only compare a maximum of ${MAX_COMPARE} properties.`);
    }
  };

  // Function to remove a property from the list
  const removeProperty = (propertyId: number) => {
    setProperties(prev => prev.filter(p => p._id !== propertyId));
  };

  // Function to clear the entire list
  const clearProperties = () => {
    setProperties([]);
  };

  // The value object provides the state and functions to all child components
  const value = {
    properties,
    addProperty,
    removeProperty,
    clearProperties,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};