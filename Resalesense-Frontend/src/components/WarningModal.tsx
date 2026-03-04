// resalesense-frontend/src/components/WarningModal.tsx
import React, { useState } from 'react'; // <-- Import useState
import { useAuth } from '../context/AuthContext';
import './WarningModal.css';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Warning } from '../context/AuthContext';

// Helper to format the date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
}

export const WarningModal: React.FC = () => {
  const { currentUser, dismissWarning } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false); // <-- Add state

  // Find the *first* unread warning
  const firstUnreadWarning = currentUser?.warnings.find(w => !w.read);

  // --- 1. THIS IS THE NEW API CALL ---
  const markWarningAsReadInDb = async (warningId: string) => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:4000/api/users/warnings/${warningId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }) // Send userId for verification
      });

      if (!response.ok) {
        throw new Error('Failed to mark warning as read.');
      }
      
      console.log(`Warning ${warningId} marked as read in DB.`);
      
      // Only dismiss from *frontend state* after API call is successful
      dismissWarning(firstUnreadWarning!._id);
      
    } catch (error) {
      console.error(error);
      // Don't close the modal if the API fails, so they see it again
      // You could show an error message here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = () => {
    if (!firstUnreadWarning || isSubmitting) return;

    // 1. Mark as read in the backend 
    // (which will call dismissWarning on success)
    markWarningAsReadInDb(firstUnreadWarning._id);

    // 2. Navigate to the terms page
    navigate('/terms');
  };

  if (!firstUnreadWarning) {
    return null;
  }

  return (
    <div className="warning-backdrop">
      <div className="warning-modal">
        <div className="warning-header">
          <AlertTriangle size={32} />
          <h2>Official Warning</h2>
        </div>
        <p className="warning-message">
          You have received a warning from an administrator on 
          <strong> {formatDate(firstUnreadWarning.issuedAt)}</strong> 
          for the following reason:
        </p>
        <blockquote className="warning-message" style={{ fontStyle: 'italic', background: '#f9fafb', padding: '1rem', borderRadius: '0.25rem' }}>
          "{firstUnreadWarning.message}"
        </blockquote>
        <p className="warning-message" style={{ fontSize: '0.875rem' }}>
          Please review our community guidelines. Further violations may result in a ban.
        </p>
        <div className="warning-footer">
          <button className="button" onClick={handleAcknowledge} disabled={isSubmitting}>
            {isSubmitting ? 'Acknowledging...' : 'View Terms & Acknowledge'}
          </button>
        </div>
      </div>
    </div>
  );
};