// resalesense-frontend/src/pages/MapPage/MapPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import PropertyFilters from './parts/PropertyFilters';
import { useAuth } from '../../context/AuthContext';
import { useComparison } from '../../context/ComparisonContext';
import { Bookmark, Expand } from 'lucide-react';
import './MapPage.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Type for filter data
type FilterViewMode = 'sliders' | 'inputs';
interface FilterData { stats: any; towns: string[]; flats: string[]; models: string[]; }
// PropertyListItem Interface
interface PropertyListItem {
    _id: number; block: string; street_name: string; flat_type: string;
    resale_price: number; lease_commence_date: number;
    remaining_lease_years?: number; image_url?: string;
    latitude?: number; longitude?: number;
}
// Helper Functions
const calculateRemainingLease = (leaseCommenceDate: number): number | undefined => {
    if (!leaseCommenceDate) return undefined;
    const currentYear = new Date().getFullYear();
    const expiryYear = leaseCommenceDate + 99;
    return Math.max(0, expiryYear - currentYear);
};
const getImageUrl = (propertyId: number): string => {
  return `https://picsum.photos/seed/${propertyId}/150/100`;
};

// --- FIX: Added 'return null' to MapBoundsUpdater ---
const MapBoundsUpdater: React.FC<{ properties: PropertyListItem[] }> = ({ properties }) => {
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

// --- REMOVED MapCleanup COMPONENT ---

const MapPage: React.FC = () => {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
        const savedPage = sessionStorage.getItem('mapPageCurrentPage');
        return savedPage ? parseInt(savedPage, 10) : 1;
    } catch (e) { return 1; }
  });
  const [totalProperties, setTotalProperties] = useState(0);
  const [viewMode, setViewMode] = useState<FilterViewMode>(() => {
    return (sessionStorage.getItem('filterViewMode') as FilterViewMode) || 'sliders'; 
  });
  const [currentFilters, setCurrentFilters] = useState<any>(() => {
    try {
        const savedFilters = sessionStorage.getItem('mapPageFilters');
        return savedFilters ? JSON.parse(savedFilters) : {};
    } catch (e) { return {}; }
  });
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { currentUser, updateBookmarks } = useAuth();
  const { addProperty } = useComparison();
  const isMounted = useRef(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const fetchListData = useCallback(async (filters = {}, pageNumber = 1) => {
    setIsLoading(true);
    setError(null);
    
    if (JSON.stringify(filters) !== JSON.stringify(currentFilters)) {
        setCurrentFilters(filters);
        sessionStorage.setItem('mapPageFilters', JSON.stringify(filters));
    }
    
    setCurrentPage(pageNumber);
    sessionStorage.setItem('mapPageCurrentPage', String(pageNumber));
    
    try {
      const response = await fetch('http://localhost:4000/api/properties/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, page: pageNumber, limit: itemsPerPage }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
         let errorMessage = 'Failed to fetch property list.';
         if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            errorMessage = data.message || 'Failed to fetch property list.';
         }
         throw new Error(errorMessage);
      }
      const data: { properties: PropertyListItem[], totalCount: number } = await response.json();
      const processedData = data.properties.map(prop => ({
          ...prop,
          remaining_lease_years: calculateRemainingLease(prop.lease_commence_date),
          image_url: getImageUrl(prop._id)
      }));
      setProperties(processedData);
      setTotalProperties(data.totalCount);
    } catch (err: any) {
      setError(err.message);
      setProperties([]);
      setTotalProperties(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  useEffect(() => {
     if (!isMounted.current) {
        isMounted.current = true;
        fetchListData(currentFilters, currentPage);
     }
  }, [fetchListData, currentFilters, currentPage]);

  useEffect(() => {
    const panel = leftPanelRef.current;
    if (panel) {
        L.DomEvent.disableClickPropagation(panel);
        L.DomEvent.disableScrollPropagation(panel);
    }
  }, []); 

  const handleFilterChange = (filters: any) => {
    fetchListData(filters, 1);
  };
  
  const handleToggleViewMode = () => {
    const newMode = viewMode === 'sliders' ? 'inputs' : 'sliders';
    setViewMode(newMode);
    sessionStorage.setItem('filterViewMode', newMode);
  };
  const isBookmarked = (propertyId: number): boolean => { 
    return !!currentUser?.bookmarks?.includes(propertyId); 
  };
  
  const handleToggleBookmark = async (propertyId: number) => {
    if (!currentUser) { 
        toast.error('Please log in to manage bookmarks.');
        navigate('/login'); 
        return; 
    }
    if (currentUser.verificationStatus !== 'verified') { 
        toast.error('Your account must be verified to manage bookmarks.');
        return; 
    }
    
    const isCurrentlyBookmarked = isBookmarked(propertyId);
    const loadingToastId = toast.loading(isCurrentlyBookmarked ? 'Removing bookmark...' : 'Saving bookmark...');

    try {
        const response = await fetch(`http://localhost:4000/api/users/${currentUser.id}/bookmarks`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId: propertyId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update bookmarks.');
        
        if (data.bookmarks) {
            updateBookmarks(data.bookmarks); 
            toast.dismiss(loadingToastId);
            if (isCurrentlyBookmarked) {
                toast.success('Bookmark removed!');
            } else {
                toast.success('Bookmark saved!');
            }
        }
    } catch (err: any) { 
        console.error('Bookmark toggle failed:', err); 
        toast.dismiss(loadingToastId);
        toast.error(`Error: ${err.message}`); 
    }
  };
  
  const totalPages = Math.ceil(totalProperties / itemsPerPage);
  const goToNextPage = () => { if (currentPage < totalPages) fetchListData(currentFilters, currentPage + 1); };
  const goToPrevPage = () => { if (currentPage > 1) fetchListData(currentFilters, currentPage - 1); };

  const handleMapClick = () => {
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
               queryParams.append(key, String(value));
          }
      });
      const queryString = queryParams.toString();
      
      navigate(`/full-map${queryString ? `?${queryString}` : ''}`, {
          state: { 
              initialData: filterData,
              viewMode: viewMode 
          }
      });
  };

  return (
    <div className="map-page-layout">
      <div className="left-panel" ref={leftPanelRef}>
        <PropertyFilters
          onFilterChange={handleFilterChange}
          isLoading={isLoading && currentPage === 1}
          propertyCount={totalProperties}
          onDataLoaded={(data) => setFilterData(data)}
          initialValues={currentFilters}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
        />
        <button 
          className="button-outline" 
          onClick={handleMapClick} 
          style={{
            width: '100%', 
            marginTop: '-0.5rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Expand size={16} />
          View Full Map
        </button>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>}
        <div className="property-list">
          {isLoading && <p>Loading properties...</p>}
          {!isLoading && properties.length === 0 && (
             <p>No properties found matching your criteria.</p>
          )}
          {!isLoading && properties.map((prop) => (
            <div key={prop._id} className="property-card-item card">
              <div className="property-card-image">
                 <Link to={`/property/${prop._id}`}>
                    <img src={prop.image_url} alt={`${prop.block} ${prop.street_name}`} />
                 </Link>
              </div>
              <div className="property-card-info">
                  <Link to={`/property/${prop._id}`} style={{textDecoration:'none', color:'inherit'}}>
                    <h4>{prop.block} {prop.street_name}</h4>
                  </Link>
                  <p>Type: {prop.flat_type}</p>
                  <p className="price">
                    Price: {prop?.resale_price?.toLocaleString ? `$${prop.resale_price.toLocaleString()}` : 'N/A'}
                  </p>
                  <p>Lease: {prop.remaining_lease_years !== undefined ? `${prop.remaining_lease_years} years left` : 'N/A'}</p>
                 <button
                    onClick={() => addProperty(prop)}
                    className="button-outline button-sm"
                    style={{marginTop: '0.5rem'}}
                    >
                     Compare
                 </button>
              </div>
              <button
                 className={`property-card-bookmark ${isBookmarked(prop._id) ? 'bookmarked' : ''}`}
                 onClick={() => handleToggleBookmark(prop._id)}
                 title={isBookmarked(prop._id) ? 'Remove Bookmark' : 'Add Bookmark'}
                 disabled={!currentUser || currentUser.verificationStatus !== 'verified'}
              >
                  <Bookmark size={20} fill={isBookmarked(prop._id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          ))}
          {!isLoading && totalProperties > 0 && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                  <button className="button-outline" onClick={goToPrevPage} disabled={currentPage === 1 || isLoading}>
                      &larr; Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button className="button-outline" onClick={goToNextPage} disabled={currentPage === totalPages || isLoading}>
                      Next &rarr;
                  </button>
              </div>
          )}
        </div>
      </div>
      <div className="map-container-wrapper"> 
        <MapContainer
          key={JSON.stringify(properties)}
          center={[1.3521, 103.8198]} 
          zoom={12} 
          style={{ height: "100%", width: "100%" }} 
          scrollWheelZoom={true} 
          dragging={true}
          zoomControl={true}
        >
          {/* --- REMOVED MapCleanup COMPONENT --- */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          {!isLoading && properties
            .filter(prop => prop && prop.latitude && prop.longitude)
            .map(prop => (
              <Marker key={prop._id} position={[prop.latitude!, prop.longitude!]} >
                <Popup> 
                  <div>
                    <strong>{prop.block} {prop.street_name}</strong>
                    <p>Price: {prop?.resale_price?.toLocaleString ? `$${prop.resale_price.toLocaleString()}` : 'N/A'}</p>
                    <Link to={`/property/${prop._id}`}>View Details &rarr;</Link>
                  </div>
                </Popup>
              </Marker>
          ))}
          <MapBoundsUpdater properties={properties} />
        </MapContainer>
        <div className="full-map-button-container">
            <button className="button" onClick={handleMapClick}>
                <Expand size={16} style={{ marginRight: '0.5rem' }} />
                View Full Map
            </button>
        </div>
      </div>
    </div>
  );
}

export default MapPage;