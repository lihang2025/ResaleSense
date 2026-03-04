// src/pages/DetailedInsightsPage/components/AreaView.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PriceHistoryGraph from './PriceHistoryGraph';
import CommunityDiscussion from './CommunityDiscussion';
import { useAuth } from '../../../context/AuthContext';

// --- Interfaces ---
interface PriceHistoryEntry { year: number; price: number; }
interface Property {
    _id: number; block: string; street_name: string; month: string; resale_price: number;
    town: string; flat_type: string; flat_model: string; floor_area_sqm: number;
    storey_range: string; remaining_lease: string; lease_commence_date: number;
}
interface AreaViewProps { properties: Property[]; townName: string; }
// --- END Interfaces ---


const AreaView: React.FC<AreaViewProps> = ({ properties, townName }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const ITEMS_PER_PAGE = 10; 

    const { currentUser } = useAuth();
    const isVerified = currentUser?.verificationStatus === 'verified';

    // --- Logic Hooks (Unchanged) ---
    const filteredProperties = useMemo(() => {
      if (!properties) return [];
      if (!searchQuery.trim()) {
        return properties;
      }
      const lowerCaseQuery = searchQuery.toLowerCase();
      return properties.filter(prop => {
        if (!prop) return false; 
        const address = `${prop.block || ''} ${prop.street_name || ''}`.toLowerCase();
        const flatType = (prop.flat_type || '').toLowerCase();
        return address.includes(lowerCaseQuery) || flatType.includes(lowerCaseQuery);
      });
    }, [properties, searchQuery]);

    const sortedProperties = useMemo(() => {
        if (!filteredProperties) return [];
        return [...filteredProperties].sort((a, b) => b.month.localeCompare(a.month));
    }, [filteredProperties]);

    const getAreaPriceTrend = useCallback((): PriceHistoryEntry[] => {
        if (!properties) return [];
        const yearlyData: { [year: number]: { total: number; count: number } } = {};
        properties.forEach(p => {
            if (p?.month && typeof p.month === 'string' && p.resale_price) {
                const year = parseInt(p.month.substring(0, 4));
                if (!isNaN(year)) {
                    if (!yearlyData[year]) yearlyData[year] = { total: 0, count: 0 };
                    yearlyData[year].total += p.resale_price;
                    yearlyData[year].count += 1;
                }
            }
        });
        return Object.keys(yearlyData).map(yearStr => ({
            year: parseInt(yearStr),
            price: yearlyData[parseInt(yearStr)].total / yearlyData[parseInt(yearStr)].count,
        })).sort((a, b) => a.year - b.year);
    }, [properties]); 

    const areaPriceHistory = getAreaPriceTrend();

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);
    // --- END Logic Hooks ---
    
    const lastUpdatedDate = new Date().toLocaleDateString('en-SG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    if (!properties || properties.length === 0) {
        return (
          <div className="page-container">
            <div className="page-error">No properties found for this area.</div>
          </div>
        );
    }

    const totalPages = Math.ceil(sortedProperties.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentProperties = sortedProperties.slice(indexOfFirstItem, indexOfLastItem);

    const renderPageNumbers = () => {
        const pageButtons = [];
        const MAX_VISIBLE_PAGES = 10;
        const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
        let startPage = Math.max(1, currentPage - halfWindow);
        let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
        if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
            startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
        }
        if (startPage > 1) {
            pageButtons.push(<button key="1" onClick={() => setCurrentPage(1)} className="button-outline button-sm">1</button>);
            if (startPage > 2) pageButtons.push(<span key="start-ellipsis" style={{ padding: '0 8px' }}>...</span>);
        }
        for (let i = startPage; i <= endPage; i++) {
            pageButtons.push(<button key={i} onClick={() => setCurrentPage(i)} className={currentPage === i ? 'button button-sm' : 'button-outline button-sm'}>{i}</button>);
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pageButtons.push(<span key="end-ellipsis" style={{ padding: '0 8px' }}>...</span>);
            pageButtons.push(<button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="button-outline button-sm">{totalPages}</button>);
        }
        return pageButtons;
    };

    return (
        <div className="page-container">
            <h1 className="area-view-header">
                Insights for: {townName}
            </h1>
            <p className="area-view-timestamp">
                Data last updated on: {lastUpdatedDate}
            </p>

            <div className="main-grid">
                {/* Available Properties Column */}
                <div className="card">
                    <h3 className="valuation-card-header">Available Properties ({sortedProperties.length} found)</h3>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <input
                        type="text"
                        placeholder="Search by address or flat type..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    {sortedProperties.length === 0 && searchQuery.trim() && (
                        <p className="comment-info-box" style={{ marginBottom: 0 }}>
                            No properties match your search.
                        </p>
                    )}
                    <div className="comment-list">
                        {currentProperties.map((property) => {
                            if (!property?._id) return null; 
                            const address = `${property.block} ${property.street_name}`;
                            return (
                                <Link to={`/property/${property._id}`} key={property._id} className="property-list-item-link">
                                    <div>
                                        <div className="property-list-item-header">
                                            <h4>{address}</h4>
                                            <span>{property.month}</span>
                                        </div>
                                        <p className="property-list-item-price">
                                            {typeof property.resale_price === 'number' ? `$${property.resale_price.toLocaleString()}` : 'Price N/A'}
                                        </p>
                                        <p className="property-list-item-details">
                                            {property.flat_type} | Lease Remaining: {property.remaining_lease || 'N/A'}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            {renderPageNumbers()}
                        </div>
                    )}
                </div>

                {/* Right Column (Graph & Discussion) */}
                <div className="details-column-right">
                    <div className="card">
                        {/* --- UPDATED: Pass title prop --- */}
                        <PriceHistoryGraph
                            historyData={areaPriceHistory}
                            predictionData={[]}
                            title="Area Average Price Trend"
                        />
                    </div>
                    <div className="card">
                        <CommunityDiscussion 
                            townName={townName} 
                            isVerified={isVerified} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AreaView;