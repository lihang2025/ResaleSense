// resalesense-frontend/src/pages/AdminPage/components/VerifyUserTable.tsx
import React from 'react';

// We'll create this type in types.ts next
import { PendingVerification } from '../types'; 

interface VerifyUserTableProps {
  verifications: PendingVerification[];
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

// Helper to format the date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD
}

// Helper to format ID
const formatId = (id: string, prefix: string) => {
  return `${prefix}_${id.slice(-6)}`;
}

const VerifyUserTable: React.FC<VerifyUserTableProps> = ({ verifications, onApprove, onReject }) => {
  
  const safeVerifications = verifications || [];
  
  return (
    <div className="table-wrapper">
      <div style={{ padding: '1rem', paddingTop: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Pending User Verifications</h3>
        <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>Review and process pending applications for user verification.</p>
      </div>

      <table className="table">
        <thead className="table-header">
          <tr className="table-row">
            <th className="table-head">User ID</th>
            <th className="table-head">Name</th>
            <th className="table-head">Email</th>
            <th className="table-head">Request Date</th>
            <th className="table-head">Status</th>
            <th className="table-head">Actions</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {safeVerifications.length === 0 ? (
            <tr className="table-row">
              <td colSpan={6} className="table-cell" style={{ textAlign: 'center', color: '#6b7280' }}>
                No pending verifications found.
              </td>
            </tr>
          ) : (
            safeVerifications.map(user => (
              <tr key={user._id} className="table-row">
                <td className="table-cell">{formatId(user._id, 'usr')}</td>
                <td className="table-cell">{user.name}</td>
                <td className="table-cell">{user.email}</td>
                <td className="table-cell">{formatDate(user.createdAt)}</td>
                <td className="table-cell">
                  <span className={`status-badge status-${user.verificationStatus === 'pending' ? 'flagged' : 'secondary'}`}>
                    {user.verificationStatus === 'pending' ? 'Pending' : 'Unverified'}
                  </span>
                </td>
                <td className="table-cell">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="table-action-button"
                      onClick={() => onApprove(user._id)}
                    >
                      Approve
                    </button>
                    <button
                      className="table-action-button-danger"
                      onClick={() => onReject(user._id)}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VerifyUserTable;