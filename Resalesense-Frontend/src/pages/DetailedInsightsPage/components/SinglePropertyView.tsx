// resalesense-frontend/src/pages/DetailedInsightsPage/components/SinglePropertyView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'; // <-- Import useMap
import L from 'leaflet'; 
import 'leaflet/dist/leaflet.css'; 
import { useComparison } from '../../../context/ComparisonContext'; 
import { useAuth } from '../../../context/AuthContext'; 
import PriceHistoryGraph from './PriceHistoryGraph'; 
import CommunityDiscussion from './CommunityDiscussion'; 
import PredictionTool from './PredictionTool'; 
import NearbyAmenities from '../parts/NearbyAmenities'; 
import ShareButton from '../parts/ShareButton'; 
import icon from 'leaflet/dist/images/marker-icon.png'; 
import iconShadow from 'leaflet/dist/images/marker-shadow.png'; 
import CommunityValuationDisplay from './CommunityValuationDisplay';
import { Bookmark, MapPin, HelpCircle } from 'lucide-react';

// ... (Icon Fix, Interfaces, Helpers are unchanged) ...
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;
const amenityIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/684/684908.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
interface Property {
    _id: number; block: string; street_name: string; month: string; resale_price: number;
    town: string; flat_type: string; flat_model: string; floor_area_sqm: number;
    storey_range: string; remaining_lease: string; lease_commence_date: number;
    latitude?: number; 
    longitude?: number;
}
interface PriceHistoryEntry { year: number; price: number; }
interface Amenity {
  name: string;
  type: string;
  distance: string;
  lat: number;
  lon: number;
}
const getStreetPriceTrend = (property: Property, areaProperties: Property[]): PriceHistoryEntry[] => {
    if (!areaProperties || areaProperties.length === 0) return [];
    const streetProperties = areaProperties.filter(p => p.street_name === property.street_name);
    const yearlyData: { [year: number]: { total: number; count: number } } = {};
    streetProperties.forEach(p => {
        if (p && p.month && typeof p.month === 'string' && p.resale_price) {
            const year = parseInt(p.month.substring(0, 4), 10);
            if (!isNaN(year)) { 
                if (!yearlyData[year]) yearlyData[year] = { total: 0, count: 0 };
                yearlyData[year].total += p.resale_price;
                yearlyData[year].count += 1;
            }
        }
    });
    return Object.keys(yearlyData).map(yearStr => {
        const year = parseInt(yearStr, 10);
        return { year: year, price: yearlyData[year].total / yearlyData[year].count };
    }).sort((a, b) => a.year - b.year);
};

// --- 1. FIX: Added MapCleanup component ---
const MapCleanup: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    return () => {
      map.remove();
    };
  }, [map]);
  return null;
};
// --- END FIX ---


const PageHeader: React.FC = () => {
  const lastUpdatedDate = new Date().toLocaleDateString('en-SG', {
      day: '2-digit', month: '2-digit', year: 'numeric'
  });
  return (
    <div className="details-page-header">
        <div>
            <h1>Detailed Insights View</h1>
            <p className="timestamp">
                Data last updated on: {lastUpdatedDate}
            </p>
        </div>
        <ShareButton />
    </div>
  );
};

const PropertyDetailsCard: React.FC<{
    property: Property;
    isCompared: boolean; onCompareClick: () => void;
    isBookmarked: boolean; onBookmarkClick: () => void;
    isVerified: boolean;
    amenities: Amenity[] | null;
}> = ({ property, isCompared, onCompareClick, isBookmarked, onBookmarkClick, isVerified, amenities }) => {
    const address = `${property.block} ${property.street_name}`;
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="details-map-container">
                {property && property.latitude && property.longitude ? (
                    <MapContainer
                        key={property._id}
                        center={[property.latitude, property.longitude]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        dragging={true} zoomControl={true} scrollWheelZoom={true}
                        doubleClickZoom={true} touchZoom={true} attributionControl={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[property.latitude, property.longitude]}>
                            <Popup>{address}</Popup>
                        </Marker>
                        <Circle 
                          center={[property.latitude, property.longitude]} 
                          radius={500} 
                          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }} 
                        />
                        {amenities && amenities
                          .filter(amenity => amenity && amenity.lat && amenity.lon)
                          .map(amenity => (
                            <Marker 
                                key={amenity.name} 
                                position={[amenity.lat, amenity.lon]}
                                icon={amenityIcon}
                            >
                                <Popup>
                                    <strong>{amenity.name}</strong><br/>
                                    Type: {amenity.type}<br/>
                                    Distance: {amenity.distance}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                ) : (
                    <div className="details-map-unavailable">
                        Map preview unavailable
                    </div>
                )}
            </div>
            <div>
                <div className="details-header">
                    <h2>{address}</h2>
                    <button
                        onClick={onBookmarkClick}
                        disabled={!isVerified}
                        className="bookmark-button" 
                        title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                    >
                         <Bookmark
                            size={28}
                            fill={isBookmarked ? 'currentColor' : 'none'}
                            className={isBookmarked ? 'bookmarked-icon' : ''}
                            />
                    </button>
                </div>
                <p className="details-text-block">
                    <strong>Transaction Date:</strong> {property.month}<br/>
                    <strong>Price:</strong> {typeof property.resale_price === 'number' ? `$${property.resale_price.toLocaleString()}`: 'N/A'}<br/>
                    <strong>Town:</strong> {property.town}<br/>
                    <strong>Flat Type:</strong> {property.flat_type}<br/>
                    <strong>Floor Area:</strong> {property.floor_area_sqm} sqm<br/>
                    <strong>Storey Range:</strong> {property.storey_range}<br/>
                    <strong>Remaining Lease:</strong> {property.remaining_lease}
                </p>
            </div>
            <button onClick={onCompareClick} disabled={isCompared} className={isCompared ? "button-secondary" : "button"} style={{ marginTop: '1rem' }}>
                {isCompared ? 'Added to Comparison' : 'Compare with others →'}
            </button>
        </div>
    );
};
// --- END Sub-Components ---


// --- MAIN COMPONENT ---
const SinglePropertyView: React.FC<{ property: Property, areaProperties: Property[] }> = ({ property, areaProperties }) => {
    const { addProperty, properties: comparedProperties } = useComparison();
    const { currentUser, updateBookmarks } = useAuth();
    const navigate = useNavigate();

    const isVerified = currentUser?.verificationStatus === 'verified';

    const [amenities, setAmenities] = useState<Amenity[] | null>(null);
    const [amenitiesLoading, setAmenitiesLoading] = useState(true);
    const [amenitiesError, setAmenitiesError] = useState<string | null>(null);

    const [avgCommunityPrice, setAvgCommunityPrice] = useState<number | null>(null);
    const [communityVoteCount, setCommunityVoteCount] = useState<number | null>(null);
    const [userHasVoted, setUserHasVoted] = useState(false);
    const [avgPriceLoading, setAvgPriceLoading] = useState(true);

    const fetchCommunityAverage = useCallback(async () => {
        if (!property?._id) return; 
        
        setAvgPriceLoading(true);
         try {
            let url = `http://localhost:4000/api/remarks/average/${property._id}`;
            if (currentUser) {
                url += `?userId=${currentUser.id}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load community average.');
            
            const data = await response.json(); 
            setAvgCommunityPrice(data.average);
            setCommunityVoteCount(data.count);
            setUserHasVoted(data.userHasVoted || false); 

        } catch (err: any) { 
            console.error(err);
            setAvgCommunityPrice(null);
            setCommunityVoteCount(null);
            setUserHasVoted(false);
        } finally {
            setAvgPriceLoading(false);
        }
    }, [property?._id, currentUser]);


    useEffect(() => {
        if (!property?._id) return;

        const fetchAmenities = async () => {
            setAmenitiesLoading(true);
            setAmenitiesError(null);
            try {
                const response = await fetch(`http://localhost:4000/api/properties/${property._id}/amenities`);
                if (!response.ok) throw new Error('Failed to load amenity data.');
                const data = await response.json();
                setAmenities(data);
            } catch (err: any) {
                setAmenitiesError(err.message);
            } finally {
                setAmenitiesLoading(false);
            }
        };

        fetchAmenities();
        fetchCommunityAverage();
        
    }, [property?._id, fetchCommunityAverage]);


    if (!property) {
         return <div className="page-container"><div className="page-loading">Loading property details...</div></div>;
    }

    const isCompared = comparedProperties.some(p => p._id === property._id);
    const isBookmarked = currentUser?.bookmarks.includes(property._id) ?? false;
    const streetPriceHistory = getStreetPriceTrend(property, areaProperties);

    const handleBookmarkToggle = async () => {
        if (!currentUser) { alert('Please log in to manage bookmarks.'); navigate('/login'); return; }
        if (!isVerified) { alert('Your account must be verified to manage bookmarks.'); return; }
        try {
            const response = await fetch(`http://localhost:4000/api/users/${currentUser.id}/bookmarks`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: property._id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update bookmarks.');
            if (data.bookmarks) updateBookmarks(data.bookmarks);
        } catch (err: any) { console.error('Bookmark toggle failed:', err); alert(`Error: ${err.message}`); }
    };

    const handleVoteClick = (vote: 'Over-valued' | 'Fair Value' | 'Under-valued') => {
        if (!currentUser) { alert('Please log in to vote and add remarks.'); navigate('/login'); return; }
        if (!isVerified) { alert('Your account must be verified to vote and add remarks.'); return; }
        navigate('/create-remark', { 
            state: { 
                propertyId: property._id, 
                vote: vote,
                propertyPrice: property.resale_price
            } 
        });
    };

    const handleRemarkDeleted = () => {
        fetchCommunityAverage();
    };

    return (
        <div className="page-container">
            <PageHeader />
            <div className="main-grid">
                {/* === LEFT COLUMN === */}
                <div className="details-column-left">
                    
                    <PropertyDetailsCard
                        property={property}
                        isCompared={isCompared}
                        onCompareClick={() => addProperty(property)}
                        isBookmarked={isBookmarked}
                        onBookmarkClick={handleBookmarkToggle}
                        isVerified={isVerified}
                        amenities={amenities} 
                    />

                    <div className="card">
                        <PredictionTool propertyId={property._id} />
                    </div>
                    
                    <div className="card">
                         <h3 className="valuation-card-header with-tooltip">
                            Community Valuation
                            <div className="tooltip-container">
                                <HelpCircle size={16} className="tooltip-icon" />
                                <div className="tooltip-box">
                                    <strong>What does this mean?</strong>
                                    <p>This compares the list price to the community's average vote.</p>
                                    <ul>
                                        <li className="text-green">
                                            <strong>Under-valued (Good Deal):</strong> Community thinks it's worth <strong>more</strong> than the list price.
                                        </li>
                                        <li className="text-red">
                                            <strong>Over-valued (Bad Deal):</strong> Community thinks it's worth <strong>less</strong> than the list price.
                                        </li>
                                        <li className="text-gray">
                                            <strong>Fair Value:</strong> Community average is very close to the list price.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                         </h3>
                         
                         <CommunityValuationDisplay
                            listPrice={property.resale_price}
                            communityPrice={avgCommunityPrice}
                            voteCount={communityVoteCount} 
                            isLoading={avgPriceLoading}
                         />
                         
                         {isVerified ? (
                            userHasVoted ? (
                                <p className="valuation-card-subheader" style={{textAlign: 'center', fontStyle: 'italic'}}>
                                    Thank you for your vote!
                                </p>
                            ) : (
                                <>
                                    <p className="valuation-card-subheader" style={{textAlign: 'center'}}>How do you feel about this property's value?</p>
                                    <div className="vote-button-group">
                                        <button onClick={() => handleVoteClick('Under-valued')} className="button-outline button-success">Under-valued</button>
                                        <button onClick={() => handleVoteClick('Fair Value')} className="button-outline">Fair Value</button>
                                        <button onClick={() => handleVoteClick('Over-valued')} className="button-outline button-danger">Over-valued</button>
                                    </div>
                                </>
                            )
                         ) : (
                             <p style={{ color: 'var(--muted-foreground)', textAlign:'center' }}>Account must be verified to vote.</p>
                         )}
                    </div>
                    
                    <NearbyAmenities 
                        amenities={amenities} 
                        isLoading={amenitiesLoading} 
                        error={amenitiesError} 
                    />
                </div>
                
                {/* === RIGHT COLUMN === */}
                <div className="details-column-right">
                    <div className="card">
                        <PriceHistoryGraph 
                            historyData={streetPriceHistory} 
                            predictionData={[]}
                            title="Street Average Price Trend" 
                        />
                    </div>
                    <div className="card">
                        <CommunityDiscussion 
                            propertyId={property._id} 
                            townName={property.town} 
                            isVerified={isVerified} 
                            onRemarkDeleted={handleRemarkDeleted}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- END MAIN COMPONENT ---

export default SinglePropertyView;