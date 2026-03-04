// resalesense-frontend/src/pages/BookmarksPage/BookmarksPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useComparison } from '../../context/ComparisonContext'; // 1. Import hooks
import { Bookmark } from 'lucide-react';
import '../MapPage/MapPage.css'; // 2. Import styles

// 3. Define the full shape of a property object
interface Property {
  _id: number;
  block: string;
  street_name: string;
  resale_price: number;
  flat_type: string;
  town: string;
  lease_commence_date: number;
  // --- Fields to be populated by helper functions ---
  remaining_lease_years?: number;
  image_url?: string;
  // --- Fields for Compare Context (optional but good practice) ---
  latitude?: number; 
  longitude?: number;
  floor_area_sqm?: number;
  storey_range?: string;
  remaining_lease?: string;
}

// 4. Add Helper Functions
const calculateRemainingLease = (leaseCommenceDate: number): number | undefined => {
    if (!leaseCommenceDate) return undefined;
    const currentYear = new Date().getFullYear();
    const expiryYear = leaseCommenceDate + 99;
    return Math.max(0, expiryYear - currentYear);
};
const getImageUrl = (propertyId: number): string => {
  return `https://picsum.photos/seed/${propertyId}/150/100`;
};
// --- End Helper Functions ---


const BookmarksPage: React.FC = () => {
  const [bookmarkedProperties, setBookmarkedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // 5. Add Pagination state
  const ITEMS_PER_PAGE = 10;
  
  const { currentUser, updateBookmarks } = useAuth();
  const { addProperty, properties: comparedProperties } = useComparison();
  const navigate = useNavigate();

  // 6. Wrap fetch logic in useCallback so it can be re-used
  const fetchBookmarks = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      setBookmarkedProperties([]); // Clear properties if user logs out
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:4000/api/users/${currentUser.id}/bookmarks`);
      if (!response.ok) {
        throw new Error('Failed to fetch your bookmarks.');
      }
      const data: Property[] = await response.json();
      
      // Process data to add image URLs and lease years
      const processedData = data.map(prop => ({
          ...prop,
          remaining_lease_years: calculateRemainingLease(prop.lease_commence_date),
          image_url: getImageUrl(prop._id)
      }));
      setBookmarkedProperties(processedData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Re-fetch if the user changes

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // 7. Add bookmark toggle logic
  const handleToggleBookmark = async (propertyId: number) => {
    if (!currentUser) return; // Should not happen if button is visible
    try {
        const response = await fetch(`http://localhost:4000/api/users/${currentUser.id}/bookmarks`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId: propertyId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update bookmarks.');
        
        // Update context
        if (data.bookmarks) {
            updateBookmarks(data.bookmarks);
        }
        
        // Re-fetch data to update this page's list
        fetchBookmarks(); 
        
    } catch (err: any) { 
        console.error('Bookmark toggle failed:', err); 
        alert(`Error: ${err.message}`); 
    }
  };

  const isCompared = (propertyId: number): boolean => {
    return comparedProperties.some(p => p._id === propertyId);
  };


  // 8. Rewrite renderContent to use pagination and new card
  const renderContent = () => {
    if (isLoading) {
      return <p className="page-loading">Loading your bookmarks...</p>;
    }

    if (error) {
      return <p className="page-error">{error}</p>;
    }

    if (!currentUser) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Please log in to view your bookmarks.</p>
          <Link to="/login" className="button">Login</Link>
        </div>
      );
    }

    if (bookmarkedProperties.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>You haven't saved any properties yet.</p>
          <Link to="/" className="button">Start Searching</Link>
        </div>
      );
    }

    // --- Pagination Logic ---
    const totalPages = Math.ceil(bookmarkedProperties.length / ITEMS_PER_PAGE);
    const paginatedProperties = bookmarkedProperties.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    const goToNextPage = () => setCurrentPage((page) => Math.min(page + 1, totalPages));
    const goToPrevPage = () => setCurrentPage((page) => Math.max(page - 1, 1));
    // --- End Pagination Logic ---

    return (
      <div className="property-list">
        {paginatedProperties.map((prop) => (
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
                  disabled={isCompared(prop._id)} // Disable if already in compare tray
                  >
                   {isCompared(prop._id) ? 'Added to Compare' : 'Compare'}
               </button>
            </div>
            <button
               className="property-card-bookmark bookmarked" // Always bookmarked on this page
               onClick={() => handleToggleBookmark(prop._id)}
               title="Remove Bookmark"
            >
                <Bookmark size={20} fill="currentColor" />
            </button>
          </div>
        ))}
        
        {/* --- Pagination Buttons --- */}
        {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                <button className="button-outline" onClick={goToPrevPage} disabled={currentPage === 1}>
                    &larr; Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button className="button-outline" onClick={goToNextPage} disabled={currentPage === totalPages}>
                    Next &rarr;
                </button>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: '1024px' }}>
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>My Bookmarks</h1>
      <div className="card" style={{ padding: '1.5rem' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default BookmarksPage;