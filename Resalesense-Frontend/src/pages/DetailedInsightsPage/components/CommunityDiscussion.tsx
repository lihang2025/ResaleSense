// resalesense-frontend/src/pages/DetailedInsightsPage/components/CommunityDiscussion.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext'; 

interface Remark {
  _id: string;
  text: string;
  userId: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
  valuationVote?: string;
  suggestedAdjustment?: string;
  isEdited?: boolean; // <-- Added this for the next feature
}

interface CommunityDiscussionProps {
    propertyId?: number; 
    townName?: string;  
    isVerified: boolean;
    onRemarkDeleted?: () => void; // <-- 1. ADD THIS NEW PROP
}

const CommunityDiscussion: React.FC<CommunityDiscussionProps> = ({ propertyId, townName, isVerified, 
    onRemarkDeleted }) => {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // --- Logic Hooks (Unchanged) ---
  const fetchRemarks = useCallback(async () => {
    let url = '';
    if (propertyId) {
      url = `http://localhost:4000/api/remarks/${propertyId}`;
    } else if (townName) {
      url = `http://localhost:4000/api/remarks/area/${townName}`;
    } else {
      setRemarks([]); 
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch comments.');
      const data = await response.json();
      setRemarks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, townName]); 

  useEffect(() => {
    fetchRemarks();
  }, [fetchRemarks]);

  const handleDirectSubmit = async (e: React.FormEvent) => {
    // ... (this function is unchanged)
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in to comment.');
      navigate('/login');
      return;
    }
    if (!newComment.trim() || (!propertyId && !townName)) return;
    setError(null);
    const remarkData: any = { userId: currentUser.id, text: newComment };
    if (propertyId) {
        remarkData.propertyId = propertyId;
    } else if (townName) {
        remarkData.town = townName;
    }
    try {
      const response = await fetch('http://localhost:4000/api/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remarkData), 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit comment.');
      setNewComment('');
      alert("Comment submitted and is now awaiting admin approval.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditClick = (remark: Remark) => {
    setEditingRemarkId(remark._id);
    setEditText(remark.text);
  };
  const handleCancelEdit = () => {
    setEditingRemarkId(null);
    setEditText('');
  };

  // --- UPDATED: handleSaveEdit ---
  // Now sends comment for re-approval
  const handleSaveEdit = async (remarkId: string) => {
    if (!currentUser || !editText.trim()) return;
    setError(null);
    try {
      const response = await fetch(`http://localhost:4000/api/remarks/${remarkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newText: editText, userId: currentUser.id }),
      });
      const result = await response.json(); // <-- Changed from updatedRemark to result
      if (!response.ok) throw new Error(result.error || 'Failed to update remark.');

      // --- Comment is sent for re-approval, so remove it from the list ---
      setRemarks(prev => prev.filter(r => r._id !== remarkId));
      alert(result.message || "Edit submitted for admin approval."); // <-- Show success message
      handleCancelEdit();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- UPDATED: handleDeleteClick (Bug Fix) ---
  const handleDeleteClick = async (remarkId: string) => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this remark?')) return;
    setError(null);
    try {
      const response = await fetch(`http://localhost:4000/api/remarks/${remarkId}/user/${currentUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json(); 
      if (!response.ok) throw new Error(result.error || 'Failed to delete remark.');

      setRemarks(prev => prev.filter(r => r._id !== remarkId));

      // --- 3. CALL THE PROP ON SUCCESS ---
      if (onRemarkDeleted) {
        onRemarkDeleted();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };
  // --- END UPDATES ---

  const canPost = (propertyId || townName); 

  return (
    <div>
      <h3 className="prediction-header">Community Discussion</h3>
      {canPost && (
          currentUser ? (
              isVerified ? (
                  <form onSubmit={handleDirectSubmit} className="comment-form">
                      <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={propertyId ? "Add your comment for this property..." : "Add your comment for this town..."}
                          required
                          className="input-field"
                          rows={3}
                      />
                      <button type="submit" className="button" style={{ marginTop: '0.5rem' }}>Post Comment</button>
                  </form>
              ) : (
                  <p className="comment-info-box">
                      Your account must be verified by an administrator before you can post comments.
                  </p>
              )
          ) : (
              <p className="comment-info-box" style={{ border: 'none' }}>
                  <Link to="/login">Log in</Link> to join the discussion.
              </p>
          )
      )}

      <div className="comment-list">
        {isLoading && <p>Loading comments...</p>}
        {error && <p className="form-error" style={{ padding: '1rem' }}>{error}</p>}
        {canPost && !isLoading && remarks.length === 0 && (
          <p className="comment-info-box" style={{ border: 'none', marginBottom: 0 }}>
            No approved comments yet. Be the first!
          </p>
        )}
        
        {remarks.map((remark) => (
          <div key={remark._id} className="card comment-card">
            {editingRemarkId === remark._id ? (
              // --- EDIT MODE ---
              <div>
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="input-field" rows={3} />
                <div className="comment-edit-actions">
                  <button onClick={() => handleSaveEdit(remark._id)} className="button-small">Save</button>
                  <button onClick={handleCancelEdit} className="button-outline button-small">Cancel</button>
                </div>
              </div>
            ) : (
              // --- DISPLAY MODE ---
              <>
                <div className="comment-header">
                  <p className="comment-author">
                    {remark.userId ? remark.userId.name : 'Anonymous'}
                    {remark.valuationVote && <span className="comment-vote">({remark.valuationVote})</span>}
                  </p>
                  <div className="comment-meta">
                    <p className="comment-date">{new Date(remark.createdAt).toLocaleDateString()}</p>
                    {currentUser && remark.userId && currentUser.id === remark.userId._id && (
                      <div className="comment-actions">
                        <button onClick={() => handleEditClick(remark)} className="comment-action-button">Edit</button>
                        <span>|</span>
                        <button onClick={() => handleDeleteClick(remark._id)} className="comment-action-button">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="comment-body">{remark.text}</p>
                {/* We can now use 'communityValuation' if it exists */}
                {/* {remark.communityValuation && <p className="comment-adjustment">Suggested Value: {formatCurrency(remark.communityValuation)}</p>} */}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityDiscussion;