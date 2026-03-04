// resalesense-frontend/src/pages/MapPage/FullMapPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import L, { Layer, StyleFunction } from 'leaflet';
import { Path } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import PropertyFilters from './parts/PropertyFilters';
import MapLegend from './parts/MapLegend';
import './parts/MapLegend.css';
import { useComparison } from '../../context/ComparisonContext'; 

// Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Type for filter data
type FilterViewMode = 'sliders' | 'inputs';
interface FilterData { stats: any; towns: string[]; flats: string[]; models: string[]; }
interface PropertyWithCoords {
  _id: number; latitude: number; longitude: number; block: string; street_name: string;
  resale_price: number; flat_type: string; floor_area_sqm: number; town: string;
  lease_commence_date: number; storey_range: string; remaining_lease: string;
}
interface TownAverage { _id: string; averagePrice: number; }

// Helper Functions
const getColorForPrice = (price: number, min: number, max: number): string => { 
  if (price === 0 || min === max) return '#ccc';
  const t = (price - min) / (max - min);
  let r, g, b;
  if (t < 0.5) {
    const t_norm = t * 2;
    r = t_norm * 255; g = 255; b = 0;
  } else {
    const t_norm = (t - 0.5) * 2;
    r = 255; g = (1 - t_norm) * 255; b = 0;
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};
const extractPlanningAreaName = (properties: any): string | null => { 
  if (!properties) return null;
  if (typeof properties.PLN_AREA_N === 'string' && properties.PLN_AREA_N.trim() !== '') {
    return properties.PLN_AREA_N.trim();
  }
  if (typeof properties.Description === 'string') {
    const match = properties.Description.match(/<th>PLN_AREA_N<\/th>\s*<td>(.*?)<\/td>/);
    if (match && match[1]) return match[1].trim();
  }
  return null;
};
const defaultStyle = { color: "#4A5568", weight: 2, opacity: 0.5, fillOpacity: 0.1 };

// --- FIX: Added 'return null' to MapBoundsUpdater ---
const MapBoundsUpdater: React.FC<{ properties: PropertyWithCoords[] }> = ({ properties }) => {
    const map = useMap();
    useEffect(() => {
        const validProperties = properties.filter(p => p && p.latitude && p.longitude);
        if (validProperties.length > 0) {
            const bounds = new L.LatLngBounds(validProperties.map(p => [p.latitude!, p.longitude!]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [properties, map]);
    return null; // <-- This fixes the 'void' type error
};

// --- REMOVED MapCleanup COMPONENT ---

const createGeoJsonInteractionsHandler = (
    townAveragesMap: { [key: string]: number },
    styleFunction: StyleFunction,
    navigate: ReturnType<typeof useNavigate>
) => {
    return (feature: any, layer: Layer) => {
      const planningAreaName = extractPlanningAreaName(feature?.properties);
      if (planningAreaName) {
        const avgPrice = townAveragesMap[planningAreaName];
        const popupContent = `
          <strong>${planningAreaName}</strong><br/>
          ${avgPrice ? `Avg. Price: $${Math.round(avgPrice).toLocaleString()}` : 'No recent sales data'}
        `;
        layer.bindPopup(popupContent);
        layer.on({
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            navigate(`/area/${planningAreaName}`);
          },
          mouseover: (e) => {
            const targetLayer = e.target as Path;
            targetLayer.setStyle({ weight: 4, fillOpacity: 0.7 });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) { targetLayer.bringToFront(); }
          },
          mouseout: (e) => {
            const targetLayer = e.target as Path;
            targetLayer.setStyle(styleFunction(feature));
          }
        });
      }
    };
};


const FullMapPage: React.FC = () => {
    const [properties, setProperties] = useState<PropertyWithCoords[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [districtGeoJson, setDistrictGeoJson] = useState<any>(null);
    const [townAverages, setTownAverages] = useState<{ [key: string]: number }>({});
    const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
    
    const navigate = useNavigate();
    const location = useLocation();
    
    const filterPanelRef = useRef<HTMLDivElement>(null);
    
    const { addProperty, properties: comparedProperties } = useComparison();
    const isCompared = (propertyId: number): boolean => {
      return comparedProperties.some(p => p._id === propertyId);
    };
    
    const locationState = location.state as { initialData?: FilterData, viewMode?: FilterViewMode };
    const initialData = locationState?.initialData;
    
    const [viewMode, setViewMode] = useState<FilterViewMode>(() => {
        return locationState?.viewMode || (sessionStorage.getItem('filterViewMode') as FilterViewMode) || 'sliders';
    });

    const initialFilters = useMemo(() => {
        const queryParams = new URLSearchParams(location.search);
        const savedFilters = JSON.parse(sessionStorage.getItem('mapPageFilters') || '{}');
        
        const filtersFromUrl: { [key: string]: any } = {
            priceRange: savedFilters.priceRange,
            areaRange: savedFilters.areaRange,
            storeyRangeSliders: savedFilters.storeyRangeSliders,
        };
        
        queryParams.forEach((value, key) => {
            const numValue = parseInt(value, 10);
            const isNum = !isNaN(numValue);
            switch (key) {
                case 'town': filtersFromUrl.town = value; break;
                case 'flat_type': filtersFromUrl.flat_type = value; break;
                case 'flat_model': filtersFromUrl.flat_model = value; break;
                case 'min_lease': filtersFromUrl.min_lease = value; break;
                case 'price_min': if(isNum) filtersFromUrl.price_min = numValue; break;
                case 'price_max': if(isNum) filtersFromUrl.price_max = numValue; break;
                case 'area_min': if(isNum) filtersFromUrl.area_min = numValue; break;
                case 'area_max': if(isNum) filtersFromUrl.area_max = numValue; break;
                case 'storey_min': if(isNum) filtersFromUrl.storey_min = numValue; break;
                case 'storey_max': if(isNum) filtersFromUrl.storey_max = numValue; break;
                default: break;
            }
        });
        
        if (filtersFromUrl.priceRange) {
            if (!filtersFromUrl.price_min) filtersFromUrl.price_min = filtersFromUrl.priceRange[0];
            if (!filtersFromUrl.price_max) filtersFromUrl.price_max = filtersFromUrl.priceRange[1];
        }
        return filtersFromUrl;
    }, [location.search]);

    const getFeatureStyle: StyleFunction = useCallback((feature) => {
        const townName = extractPlanningAreaName(feature?.properties);
        if (townName && townAverages[townName]) {
          const price = townAverages[townName];
          const color = getColorForPrice(price, priceRange.min, priceRange.max);
          return { fillColor: color, color: color, weight: 2, opacity: 0.8, fillOpacity: 0.5 };
        }
        return defaultStyle;
    }, [townAverages, priceRange]);
    
    const fetchMapData = useCallback(async (filters = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:4000/api/properties/with-coords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters),
            });
            if (!response.ok) {
                if (response.status === 404) { setProperties([]); }
                else { throw new Error('Failed to fetch map data.'); }
            } else {
                const data = await response.json();
                setProperties(data);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const fetchTownAverages = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:4000/api/properties/town-averages');
            if (!response.ok) throw new Error('Failed to load town average prices.');
            const data: TownAverage[] = await response.json();
            const priceMap: { [key: string]: number } = {};
            let min = Infinity, max = 0;
            data.forEach(item => {
              const townKey = item._id.toUpperCase();
              priceMap[townKey] = item.averagePrice;
              if (item.averagePrice < min) min = item.averagePrice;
              if (item.averagePrice > max) max = item.averagePrice;
            });
            setTownAverages(priceMap);
            setPriceRange({ min, max });
        } catch (err: any) { console.error("Error fetching town averages:", err); }
    }, []);
    
    const fetchGeoJson = useCallback(async () => {
        try {
            const response = await fetch('/planning-areas.geojson');
            if (!response.ok) throw new Error(`Failed to load district boundaries.`);
            const data = await response.json();
            setDistrictGeoJson(data);
        } catch (err: any) { console.error("Error fetching GeoJSON:", err); }
    }, []);
    
    const onEachFeatureHandler = createGeoJsonInteractionsHandler(townAverages, getFeatureStyle, navigate);
    
    useEffect(() => {
        const panel = filterPanelRef.current;
        if (panel) {
            L.DomEvent.disableClickPropagation(panel);
            L.DomEvent.disableScrollPropagation(panel);
        }
    }, []); 

    useEffect(() => {
        const { priceRange, areaRange, storeyRangeSliders, ...apiFilters } = initialFilters;
        fetchMapData(apiFilters);
        fetchGeoJson();
        fetchTownAverages();
    }, [initialFilters, fetchMapData, fetchGeoJson, fetchTownAverages]);
    
    const handleToggleViewMode = () => {
        const newMode = viewMode === 'sliders' ? 'inputs' : 'sliders';
        setViewMode(newMode);
        sessionStorage.setItem('filterViewMode', newMode);
    };
    const handleGoBack = () => { navigate(-1); };


    const mapCenter: [number, number] = [1.3521, 103.8198];
    
    const filterPanelStyle: React.CSSProperties = {
      position: 'absolute', 
      top: '10px',
      left: '10px',
      zIndex: 1000, 
      width: '360px',
      maxHeight: 'calc(100vh - 80px)', 
      overflowY: 'auto',
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: 'calc(100vh - 64px)' }}>
            
            <div style={filterPanelStyle} ref={filterPanelRef}>
                <PropertyFilters
                    onFilterChange={fetchMapData}
                    isLoading={isLoading}
                    propertyCount={properties.length} 
                    initialValues={initialFilters}
                    initialData={initialData}
                    viewMode={viewMode}
                    onToggleViewMode={handleToggleViewMode}
                />
            </div>

            {!isLoading && (
                 <div style={{
                    position: 'absolute', bottom: '150px', right: '20px', zIndex: 1000,
                    width: '200px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', fontSize: '0.875rem'
                 }}>
                     {properties.length === 0 ? (
                        <span>Zero properties found.</span>
                     ) : (
                        <span>
                            Showing {properties.length} properties.
                            {properties.length >= 200 && <span> (Display limited to 200)</span>}
                        </span>
                     )}
                 </div>
            )}
            {error && <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, background: 'rgba(255, 255, 255, 0.8)', color: 'red', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Error: {error}</div>}
            
            <MapContainer 
              key={JSON.stringify(properties)}
              center={mapCenter} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >

                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ZoomControl position="topright" />
                {districtGeoJson && (
                  <GeoJSON key={JSON.stringify(townAverages)} data={districtGeoJson} style={getFeatureStyle} onEachFeature={onEachFeatureHandler} />
                )}
                <MarkerClusterGroup key={JSON.stringify(properties)}>
                    {properties
                      .filter(prop => prop && prop.latitude && prop.longitude)
                      .map(prop => (
                      <Marker key={prop._id} position={[prop.latitude!, prop.longitude!]}>
                        <Popup>
                        <div style={{fontSize: '0.9rem', lineHeight: 1.6}}>
                          <strong style={{fontSize: '1rem'}}>{prop.block} {prop.street_name}</strong>
                          <p style={{margin: '0.5rem 0 0 0'}}>
                            <strong>Price:</strong> {typeof prop.resale_price === 'number' ? `$${prop.resale_price.toLocaleString()}` : 'N/A'}<br/>
                            <strong>Type:</strong> {prop.flat_type} <br/>
                            <strong>Area:</strong> {prop.floor_area_sqm} sqm
                          </p>
                          <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                addProperty(prop) 
                            }}
                            disabled={isCompared(prop._id)}
                            className={isCompared(prop._id) ? "button-secondary button-sm" : "button button-sm"}
                            style={{width: '100%', marginTop: '1rem', marginBottom: '0.25rem'}}
                          >
                            {isCompared(prop._id) ? 'Added to Compare' : 'Add to Compare'}
                          </button>
                          <Link to={`/property/${prop._id}`} style={{display: 'block', textAlign: 'center', fontSize: '0.8rem'}}>
                            View Details &rarr;
                          </Link>
                        </div>
                        </Popup>
                      </Marker>
                  ))}
                </MarkerClusterGroup>
                <MapBoundsUpdater properties={properties} />
            </MapContainer>
            {priceRange.max > 0 && ( <MapLegend minPrice={priceRange.min} maxPrice={priceRange.max} /> )}
            <button
                onClick={handleGoBack}
                className="button"
                style={{
                    position: 'absolute', bottom: '20px', left: '20px',
                    zIndex: 1000, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
            >
                &larr; Back to List
            </button>
        </div>
    );
};

export default FullMapPage;