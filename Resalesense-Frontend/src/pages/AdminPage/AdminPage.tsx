// resalesense-frontend/src/pages/AdminPage/AdminPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RemarkModeration from './components/RemarkModeration';
import UserManagement from './components/UserManagement';
import VerifyUserTable from './components/VerifyUserTable';
import FlagUserForm from './components/FlagUserForm';
import BanUserForm from './components/BanUserForm';
import SupportMessages from './components/SupportMessages';
import { PendingRemark, ManagedUser, PendingVerification, UserWithUnread } from './types'; 
import './AdminPage.css'; 
import {
  Users,
  MessageSquareWarning,
  LogOut,
  ShieldOff,
  UserCheck,
  Flag,
  MessagesSquare,
  MessageCircleQuestion
} from 'lucide-react';

type AdminView = 'dashboard' | 'remarks' | 'users' | 'verify' | 'discussions' | 'flag' | 'ban' | 'support';

const AdminPage: React.FC = () => {
  const [view, setView] = useState<AdminView>('dashboard');
  
  const [pendingRemarks, setPendingRemarks] = useState<PendingRemark[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<ManagedUser[]>([]);
  const [usersWithUnread, setUsersWithUnread] = useState<UserWithUnread[]>([]);
  
  // --- 1. ADD NEW STATE for "read" users ---
  const [usersWithRead, setUsersWithRead] = useState<UserWithUnread[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [userToBan, setUserToBan] = useState<string | null>(null);
  
  const { currentUser, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthLoading) return; 
    if (!currentUser) {
      alert('You must be logged in to view this page.');
      navigate('/login');
    } else if (currentUser.role !== 'Admin') {
      alert('You do not have permission to access this page.');
      navigate('/'); 
    }
  }, [currentUser, isAuthLoading, navigate]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use Promise.all to fetch data in parallel
      const [
        remarksResponse,
        usersResponse,
        verifyResponse,
        rejectedResponse,
        unreadSupportResponse,
        readSupportResponse // --- 2. ADDED new fetch response ---
      ] = await Promise.all([
        fetch('http://localhost:4000/api/admin/remarks'),
        fetch('http://localhost:4000/api/admin/users'),
        fetch('http://localhost:4000/api/admin/verifications'),
        fetch('http://localhost:4000/api/admin/rejected-users'),
        fetch('http://localhost:4000/api/admin/support/unread-users'),
        fetch('http://localhost:4000/api/admin/support/read-users') // --- 2. ADDED new fetch call ---
      ]);

      if (!remarksResponse.ok) throw new Error('Failed to fetch pending remarks.');
      setPendingRemarks(await remarksResponse.json());

      if (!usersResponse.ok) throw new Error('Failed to fetch users.');
      setUsers(await usersResponse.json());

      if (!verifyResponse.ok) throw new Error('Failed to fetch pending verifications.');
      setPendingVerifications(await verifyResponse.json());
      
      if (!rejectedResponse.ok) throw new Error('Failed to fetch rejected users.');
      setRejectedUsers(await rejectedResponse.json());
      
      if (!unreadSupportResponse.ok) throw new Error('Failed to fetch users with unread messages.');
      setUsersWithUnread(await unreadSupportResponse.json());

      // --- 2. ADDED new data setting ---
      if (!readSupportResponse.ok) throw new Error('Failed to fetch users with read messages.');
      setUsersWithRead(await readSupportResponse.json());

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && currentUser && currentUser.role === 'Admin') {
      fetchData();
    }
  }, [fetchData, isAuthLoading, currentUser]);

  useEffect(() => {
    if (view !== 'ban' && userToBan) {
      setUserToBan(null);
    }
  }, [view, userToBan]);

  // --- Handlers (All unchanged) ---
  const handleUpdateRemarkStatus = async (remarkId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`http://localhost:4000/api/admin/remarks/${remarkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update remark status.');
      setPendingRemarks(prev => prev.filter(r => r._id !== remarkId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };
  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'flagged') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update user status.');
      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u._id === userId ? updatedUser : u));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleFlagUser = async (userQuery: string, reason: string) => {
    setIsSubmitting(true);
    const query = userQuery.toLowerCase().trim();
    const userToFlag = users.find(u => 
      u._id === query || 
      u.name.toLowerCase() === query
    );

    if (!userToFlag) {
      alert("Error: User not found. Please check the ID or Name and try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${userToFlag._id}/flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json(); // Get the response from the backend
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to flag user.');
      }
      
      const updatedUser = data.user;
      const message = data.message; // Get the specific message from the backend

      setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
      alert(message); // Show the dynamic message (e.g., "User flagged" or "User banned")

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVerification = async (userId: string, action: 'approve' | 'reject') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:4000/api/admin/verifications/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} verification.`);
      }
      setPendingVerifications(prev => prev.filter(v => v._id !== userId));
      await fetchData();
      alert(`User verification ${action}d successfully.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleBanUser = async (userQuery: string, duration: string) => {
    setIsSubmitting(true);
    const query = userQuery.toLowerCase().trim();
    const userToBan = users.find(u => 
      u._id === query || 
      u.name.toLowerCase() === query
    );
    if (!userToBan) {
      alert("Error: User not found. Please check the ID or Name and try again.");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${userToBan._id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to ban user.');
      }
      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
      alert(`User ${updatedUser.name} has been banned.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- END Handlers ---

  // (useMemo for remarks - unchanged)
  const { 
    newValuationRemarks, 
    editedValuationRemarks, 
    newDiscussionRemarks, 
    editedDiscussionRemarks 
  } = useMemo(() => {
    const newValuationRemarks: PendingRemark[] = [];
    const editedValuationRemarks: PendingRemark[] = [];
    const newDiscussionRemarks: PendingRemark[] = [];
    const editedDiscussionRemarks: PendingRemark[] = [];
    for (const r of pendingRemarks) {
      if (r.valuationVote) {
        if (r.isEdited) editedValuationRemarks.push(r);
        else newValuationRemarks.push(r);
      } else {
        if (r.isEdited) editedDiscussionRemarks.push(r);
        else newDiscussionRemarks.push(r);
      }
    }
    return { newValuationRemarks, editedValuationRemarks, newDiscussionRemarks, editedDiscussionRemarks };
  }, [pendingRemarks]);

  // (Render Logic - unchanged)
  if (isAuthLoading) return <div className="page-container">Authenticating...</div>;
  if (!currentUser || currentUser.role !== 'Admin') return <div className="page-container">Redirecting...</div>;
  if (isLoading) return <div className="page-container">Loading Admin Portal Data...</div>;
  if (error) return <div className="page-container" style={{ color: 'red' }}>Error: {error}</div>;

  const handleSetActive = async (userId: string) => {
    await handleUpdateUserStatus(userId, 'active'); 
  };
  const getPageTitle = (): string => {
    if (view === 'remarks') return 'Process Remarks';
    if (view === 'users') return 'User Management';
    if (view === 'discussions') return 'Moderate Discussions';
    if (view === 'verify') return 'Pending User Verifications';
    if (view === 'flag') return 'Flag User';
    if (view === 'ban') return 'Ban User';
    if (view === 'support') return 'Support Messages';
    return 'Admin Dashboard';
  };
  const getBackView = (): AdminView => {
    if (view === 'flag') return 'dashboard'; 
    if (view === 'ban') return 'dashboard';
    return 'dashboard'; 
  }

  return (
    <div className="page-container admin-portal">
      <h1 className="admin-header">{getPageTitle()}</h1>
      {view !== 'dashboard' && (
        <button 
          className="button-outline admin-back-button"
          onClick={() => setView(getBackView())}
        >
          &larr; Back to Dashboard
        </button>
      )}

      {/* (Dashboard View - unchanged) */}
      {view === 'dashboard' && (
        <div className="admin-grid">
          <button className="admin-card-button" onClick={() => setView('verify')}><UserCheck className="icon" />Verify User</button>
          <button className="admin-card-button" onClick={() => setView('ban')}><ShieldOff className="icon" />Ban User</button>
          <button className="admin-card-button" onClick={() => setView('flag')}><Flag className="icon" />Flag User</button>
          <button className="admin-card-button" onClick={() => setView('remarks')}><MessageSquareWarning className="icon" />Process Remarks</button>
          <button className="admin-card-button" onClick={() => setView('discussions')}><MessagesSquare className="icon" />Moderate Discussions</button>
          <button className="admin-card-button" onClick={() => setView('support')}><MessageCircleQuestion className="icon" />Support Messages</button>
          <button className="admin-card-button" onClick={() => navigate('/')}><LogOut className="icon" />Quit</button>
        </div>
      )}

      {/* (Remarks View - unchanged) */}
      {view === 'remarks' && (
        <>
          <RemarkModeration remarks={newValuationRemarks} onUpdateStatus={handleUpdateRemarkStatus} type="remarks" titleOverride="New Submitted Remarks" />
          <div style={{ marginTop: '3rem' }}><RemarkModeration remarks={editedValuationRemarks} onUpdateStatus={handleUpdateRemarkStatus} type="remarks" titleOverride="Edited Remarks for Re-approval" /></div>
        </>
      )}
      
      {/* (Discussions View - unchanged) */}
      {view === 'discussions' && (
        <>
          <RemarkModeration remarks={newDiscussionRemarks} onUpdateStatus={handleUpdateRemarkStatus} type="discussions" titleOverride="New Area Discussions" />
          <div style={{ marginTop: '3rem' }}><RemarkModeration remarks={editedDiscussionRemarks} onUpdateStatus={handleUpdateRemarkStatus} type="discussions" titleOverride="Edited Discussions for Re-approval" /></div>
        </>
      )}

      {/* (Users View - unchanged) */}
      {view === 'users' && (<UserManagement users={users} onSetActive={handleSetActive} />)}
      
      {/* (Verify View - unchanged) */}
      {view === 'verify' && (
        <>
          <VerifyUserTable verifications={pendingVerifications} onApprove={(userId) => handleVerification(userId, 'approve')} onReject={(userId) => handleVerification(userId, 'reject')} />
          <div style={{ marginTop: '3rem' }}>
             <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '2rem'}}>Rejected Verifications</h2>
             {rejectedUsers.length === 0 ? (
                <p className="card" style={{textAlign:'center', color: '#6b7280'}}>No users found with rejected verification status.</p>
             ) : (
                <UserManagement users={rejectedUsers} onSetActive={handleSetActive} />
             )}
          </div>
        </> 
      )}

      {/* --- 3. UPDATE SUPPORT VIEW --- */}
      {view === 'support' && (
        <SupportMessages
          usersWithUnread={usersWithUnread}
          usersWithRead={usersWithRead} 
          currentAdminId={currentUser?.id}
        />
      )}
      
      {/* (Flag View - unchanged) */}
      {view === 'flag' && (
        <>
          <FlagUserForm onFlagUser={handleFlagUser} isSubmitting={isSubmitting} onCancel={() => setView('dashboard')} />
          <UserManagement users={users} onSetActive={handleSetActive} />
        </>
      )}
      
      {/* (Ban View - unchanged) */}
      {view === 'ban' && (
        <>
          <BanUserForm onBanUser={handleBanUser} isSubmitting={isSubmitting} initialUserQuery={userToBan || ''} onCancel={() => setView('dashboard')} />
          <UserManagement users={users} onSetActive={handleSetActive} />
        </>
      )}
    </div>
  );
};

export default AdminPage;