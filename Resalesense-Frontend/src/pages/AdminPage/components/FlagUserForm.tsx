// resalesense-frontend/src/pages/AdminPage/components/FlagUserForm.tsx
import React, { useState } from 'react';
import * as Label from '@radix-ui/react-label';
import '../../LoginPage/LoginPage.css';

// --- 1. SIMPLIFIED INTERFACE ---
interface FlagUserFormProps {
  onFlagUser: (userQuery: string, reason: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FlagUserForm: React.FC<FlagUserFormProps> = ({ onFlagUser, onCancel, isSubmitting }) => {
  const [userQuery, setUserQuery] = useState('');
  const [reason, setReason] = useState('');

  // --- 2. SIMPLIFIED SUBMIT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery || !reason) {
      alert("Please provide both a User ID/Name and a reason.");
      return;
    }
    onFlagUser(userQuery, reason); // Only passes user and reason
    setUserQuery('');
    setReason('');
  };

  const handleCancel = () => {
    setUserQuery('');
    setReason('');
    onCancel();
  };

  return (
    <div className="card login-card" style={{ maxWidth: '500px', margin: '0 auto 2rem auto' }}>
      
      <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Flag a User for Review
      </h2>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginTop: 0, marginBottom: '2rem' }}>
        Flagging a user adds them to a monitoring list for suspicious activity.
      </p>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <Label.Root className="form-label" htmlFor="userQuery">
            User ID or Name
          </Label.Root>
          <input
            id="userQuery"
            type="text"
            placeholder="Enter User ID or Name to flag"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            required
            className="input-field"
          />
        </div>

        <div className="form-group">
          <Label.Root className="form-label" htmlFor="reason">
            Reason for Flagging
          </Label.Root>
          <textarea
            id="reason"
            placeholder="Provide a mandatory reason for flagging this user..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="input-field"
            rows={5}
          />
        </div>
        
        {/* --- 3. REMOVED BAN CHECKBOX/DROPDOWN --- */}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="button-outline"
            style={{ width: '100%' }}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button"
            style={{ width: '100%' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Flagging...' : 'Flag User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FlagUserForm;