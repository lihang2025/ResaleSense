// resalesense-frontend/src/components/Navbar.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';
import './Navbar.css'; 
import { Bell } from 'lucide-react';

interface Notification {
  _id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string; 
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const Navbar: React.FC = () => {
  const { currentUser, logout, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // --- 1. REFACTORED: This function ONLY fetches the count ---
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const countResponse = await fetch(`http://localhost:4000/api/notifications/unread-count/${currentUser.id}`);
      if (countResponse.ok) {
        const data = await countResponse.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [currentUser]); // Only depends on currentUser

  // --- 2. REFACTORED: This function ONLY fetches the full list ---
  const fetchNotificationList = useCallback(async () => {
    if (!currentUser) return;
    try {
      const listResponse = await fetch(`http://localhost:4000/api/notifications/${currentUser.id}`);
      if (listResponse.ok) {
        const data = await listResponse.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notification list:", error);
    }
  }, [currentUser]); // Only depends on currentUser

  // --- 3. REFACTORED: This useEffect handles polling ---
  useEffect(() => {
    if (currentUser) {
      // Fetch count immediately on login
      fetchUnreadCount(); 
      
      // Set up a poll to check for new messages every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount(); // Just check the count
      }, 30000); // 30 seconds

      // Clear interval on logout
      return () => clearInterval(interval);
    } else {
      // Clear notifications on logout
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser, fetchUnreadCount]); // Note dependency on the new function

  // --- (This useEffect for click-outside is unchanged) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };
  
  // --- 4. REFACTORED: This handler now calls the new function ---
  const handleTogglePanel = () => {
    const newPanelState = !isPanelOpen;
    setIsPanelOpen(newPanelState);
    // If we are opening the panel, refresh the *full list*
    if (newPanelState) {
      fetchNotificationList();
    }
  };

  const handleMarkAsRead = useCallback(async (notification: Notification) => {
    if (!currentUser) return;
    
    // Optimistically update UI
    if (!notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => 
        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      );
    }
    
    setIsPanelOpen(false);
    navigate(notification.link);

    try {
      await fetch(`http://localhost:4000/api/notifications/${notification._id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      fetchUnreadCount(); // Re-sync count on error
      fetchNotificationList(); // Re-sync list on error
    }
  }, [currentUser, navigate, fetchUnreadCount, fetchNotificationList]); // Add new dependencies

  const handleMarkAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await fetch(`http://localhost:4000/api/notifications/read-all/${currentUser.id}`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      fetchUnreadCount(); // Re-sync count on error
      fetchNotificationList(); // Re-sync list on error
    }
  }, [currentUser, fetchUnreadCount, fetchNotificationList]); // Add new dependencies

  // --- (getStatusBadge function is unchanged) ---
  const getStatusBadge = (user: User) => {
    let text = '';
    let className = '';
    if (user.status === 'banned') {
      text = 'Banned';
      className = 'status-banned';
    } else if (user.status === 'flagged') {
      text = 'Flagged';
      className = 'status-flagged';
    } else {
      switch (user.verificationStatus) {
        case 'verified':
          text = 'Verified';
          className = 'status-verified';
          break;
        case 'pending':
          text = 'Pending';
          className = 'status-pending';
          break;
        case 'rejected':
          text = 'Rejected';
          className = 'status-rejected';
          break;
        case 'unverified':
        default:
          text = 'Unverified';
          className = 'status-unverified';
          break;
      }
    }
    if (className === 'status-verified') {
      return null;
    }
    return <span className={`status-badge ${className}`}>{text}</span>;
  };

  // --- (The JSX/return part is unchanged) ---
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/map" className="navbar-brand">
            <h1 className="navbar-brand-styled">ResaleSense</h1>
          </Link>
          <div className="navbar-links">
            <Link to="/full-map" className="nav-link">Map</Link>
            <Link to="/bookmarks" className="nav-link">Bookmarks</Link>
            <Link to="/faq" className="nav-link">FAQ</Link>
            
            {currentUser && currentUser.role === 'Admin' && (
              <Link to="/admin" className="nav-link admin-link">
                Admin Portal
              </Link>
            )}
          </div>
        </div>

        <div className="navbar-right">
          {isAuthLoading ? (
            <div className="user-info">Loading...</div>
          ) : currentUser ? (
            <div className="user-info">
            
              <div className="notification-wrapper" ref={panelRef}>
                <button 
                  className="notification-button"
                  onClick={handleTogglePanel}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                
                {isPanelOpen && (
                  <div className="notification-panel">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      {notifications.length > 0 && unreadCount > 0 && (
                        <button 
                          className="notification-mark-all"
                          onClick={handleMarkAllAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <ul className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <li 
                            key={notif._id}
                            className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                            onClick={() => handleMarkAsRead(notif)}
                          >
                            <p>{notif.message}</p>
                            <span>{formatTimeAgo(notif.createdAt)}</span>
                          </li>
                        ))
                      ) : (
                        <li className="notification-empty">
                          You have no notifications.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <span className="hide-on-mobile" style={{ fontWeight: 500 }}>
                {currentUser.name}
              </span>
              
              {getStatusBadge(currentUser)}
              
              <button onClick={handleLogout} className="nav-button logout button-outline">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-button login button">
                Login
              </Link>
              <Link to="/register" className="nav-button signup-outline button-outline">
                Sign Up
              </Link>
            </div>
          )}
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;