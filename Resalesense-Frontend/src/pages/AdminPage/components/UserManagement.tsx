// resalesense-frontend/src/pages/AdminPage/components/UserManagement.tsx
import React from 'react';
import { ManagedUser } from '../types';

interface UserManagementProps {
  users: ManagedUser[];
  onSetActive: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  onSetActive 
}) => {
  const safeUsers = users || [];
  
  // --- 1. SIMPLIFIED this function ---
  const formatStatus = (user: ManagedUser) => {
    if (user.status === 'banned') {
      if (user.banDuration === 'permanent') {
        return 'Banned (Permanent)';
      }
      if (user.banDuration === '1-day') {
        return 'Banned (1 Day)';
      }
      // Handle "7-days" and "7-day"
      if (user.banDuration && user.banDuration.startsWith('7-day')) {
        return 'Banned (7 Days)';
      }
      // Handle "30-days" and "30-day"
      if (user.banDuration && user.banDuration.startsWith('30-day')) {
        return 'Banned (30 Days)';
      }
      return 'Banned'; // Fallback
    }
    // Capitalize "active" or "flagged"
    return user.status.charAt(0).toUpperCase() + user.status.slice(1);
  };

  return (
    <div className="table-wrapper">
      <div style={{ padding: '1rem', paddingTop: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>User Management</h3>
        <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>View, manage, and update user roles and statuses.</p>
      </div>

      <table className="table">
        <thead className="table-header">
          <tr className="table-row">
            <th className="table-head">User</th>
            <th className="table-head">Email</th>
            <th className="table-head">Role</th>
            <th className="table-head">Status</th>
            <th className="table-head">Actions</th>
          </tr>
        </thead>
        
        <tbody className="table-body">
          {safeUsers.map(user => (
            <tr key={user._id} className="table-row">
              <td className="table-cell">
                <div style={{ fontWeight: '500' }}>{user.name}</div>
                <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
                  {user._id}
                </div>
              </td>
              <td className="table-cell">{user.email}</td>
              <td className="table-cell">{user.role}</td>
              
              {/* --- 2. UPDATED STATUS CELL --- */}
              {/* This now uses dynamic classes for color */}
              <td className="table-cell">
                <span className={`status-badge status-${user.status}`}>
                  {formatStatus(user)}
                </span>
              </td>
              {/* --- END UPDATE --- */}
              
              <td className="table-cell">
                {user.role === 'Admin' ? (
                  <em>(Admin)</em>
                ) : user.status !== 'active' ? (
                  <button
                    className="table-action-button" 
                    onClick={() => onSetActive(user._id)}
                  >
                    Set Active
                  </button>
                ) : (
                  null 
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;