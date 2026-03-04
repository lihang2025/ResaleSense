// resalesense-frontend/src/pages/AdminPage/components/RemarkModeration.tsx
import React from 'react';
import { PendingRemark } from '../types'; 
import { Link } from 'react-router-dom';

interface RemarkModerationProps {
  remarks: PendingRemark[];
  onUpdateStatus: (remarkId: string, status: 'approved' | 'rejected') => void;
  type: 'remarks' | 'discussions';
  titleOverride?: string;
}

// Helper to format the date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD
}

// Helper to format currency
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return 'N/A';
  return `$${value.toLocaleString()}`;
}


const RemarkModeration: React.FC<RemarkModerationProps> = ({ remarks, onUpdateStatus, type, titleOverride }) => {
  const safeRemarks = remarks || [];
  
  const title = titleOverride || (type === 'remarks' ? 'Submitted Valuation Remarks' : 'Pending Area Discussions');
  const subtitle = type === 'remarks' 
    ? "Review user valuations. Approving adds them to the property's discussion."
    : 'Review general area discussions for approval.';

  if (safeRemarks.length === 0) {
    return (
      <div className="table-wrapper">
        <div className="table-title-header">
          <h3>{title}</h3>
        </div>
        <p className="table-empty-message">No {type === 'remarks' ? 'valuation remarks' : 'discussions'} are currently awaiting approval.</p>
      </div>
    );
  }

  // --- 1. FIX: Define table headers in a variable ---
  // This moves the logic outside the <tr>
  let tableHeaders;
  if (type === 'remarks') {
    tableHeaders = (
      <>
        <th className="table-head">User</th>
        <th className="table-head">Property</th>
        <th className="table-head">Vote</th>
        <th className="table-head">Original Price</th>
        <th className="table-head">User's Value</th>
        <th className="table-head">Comment</th>
        <th className="table-head">Date</th>
        <th className="table-head">Actions</th>
      </>
    );
  } else {
    tableHeaders = (
      <>
        <th className="table-head">User</th>
        <th className="table-head">Town</th>
        <th className="table-head">Property</th>
        <th className="table-head">Comment</th>
        <th className="table-head">Date</th>
        <th className="table-head">Actions</th>
      </>
    );
  }
  // --- END FIX ---

  return (
    <div className="table-wrapper">
      <div className="table-title-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      <table className="table">
        <thead className="table-header">
          {/* --- 2. FIX: Render the clean variable --- */}
          <tr className="table-row">
            {tableHeaders}
          </tr>
        </thead>

        <tbody className="table-body">
          {safeRemarks.map(remark => {
            
            // --- 3. FIX: Define row content in a variable ---
            // This moves the logic outside the <tr>
            let rowContent;
            if (type === 'remarks') {
              rowContent = (
                <>
                  <td className="table-cell">
                    {remark.userId?.name || 'Unknown'}
                    {remark.isEdited && (
                      <span className="badge badge-warning">Edited</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <Link to={`/property/${remark.propertyId?._id}`} target="_blank" className="table-link">
                      {remark.propertyId?.block} {remark.propertyId?.street_name}
                    </Link>
                  </td>
                  <td className="table-cell">{remark.valuationVote}</td>
                  <td className="table-cell">{formatCurrency(remark.propertyId?.resale_price)}</td>
                  <td className="table-cell">{formatCurrency(remark.communityValuation)}</td>
                  <td className="table-cell table-cell-comment">
                    "{remark.text}"
                  </td>
                  <td className="table-cell">{formatDate(remark.createdAt)}</td>
                  <td className="table-cell">
                    <div className="table-actions">
                      <button
                        className="table-action-button"
                        onClick={() => onUpdateStatus(remark._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="table-action-button-danger"
                        onClick={() => onUpdateStatus(remark._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </>
              );
            } else {
              rowContent = (
                <>
                  <td className="table-cell">
                    {remark.userId?.name || 'Unknown'}
                    {remark.isEdited && (
                      <span className="badge badge-warning">Edited</span>
                    )}
                  </td>
                  <td className="table-cell">{remark.town}</td>
                  <td className="table-cell">
                    {remark.propertyId ? (
                      <Link to={`/property/${remark.propertyId._id}`} target="_blank" className="table-link">
                        {remark.propertyId.block} {remark.propertyId.street_name}
                      </Link>
                    ) : (
                      <span style={{color: 'var(--muted-foreground)'}}>N/A</span>
                    )}
                  </td>
                  <td className="table-cell table-cell-comment">
                    "{remark.text}"
                  </td>
                  <td className="table-cell">{formatDate(remark.createdAt)}</td>
                  <td className="table-cell">
                    <div className="table-actions">
                      <button
                        className="table-action-button"
                        onClick={() => onUpdateStatus(remark._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="table-action-button-danger"
                        onClick={() => onUpdateStatus(remark._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </>
              );
            }
            // --- END FIX ---
            
            // --- 4. FIX: Render the clean row ---
            return (
              <tr key={remark._id} className="table-row">
                {rowContent}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RemarkModeration;