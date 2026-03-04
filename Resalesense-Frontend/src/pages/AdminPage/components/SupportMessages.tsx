// resalesense-frontend/src/pages/AdminPage/components/SupportMessages.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UserWithUnread, SupportMessage } from '../types';
import { MessageSquareText, Send } from 'lucide-react';

// (AdminChatModalProps interface is unchanged)
interface AdminChatModalProps {
  user: UserWithUnread;
  onClose: () => void;
  currentAdminId: string | undefined;
}

// (AdminChatModal component is unchanged)
const AdminChatModal: React.FC<AdminChatModalProps> = ({ user, onClose, currentAdminId }) => {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null); 

    const fetchMessages = useCallback(async () => {
        if (!user?._id) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:4000/api/support/messages/${user._id}`);
            if (!response.ok) throw new Error('Failed to fetch chat history.');
            const data = await response.json();
            setMessages(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user?._id]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !user?._id || !currentAdminId) return;
        setIsSending(true);
        setError(null);
        const textToSend = replyText;
        setReplyText(''); 
        try {
            const response = await fetch(`http://localhost:4000/api/admin/support/reply/${user._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageText: textToSend,
                    adminId: currentAdminId,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send reply.');
            }
            await fetchMessages(); 
        } catch (err: any) {
            setError(err.message);
            setReplyText(textToSend); 
        } finally {
            setIsSending(false);
        }
    };
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('en-SG', {
            hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short'
        });
    }
    const getSenderName = (msg: SupportMessage): string => {
        if (msg.senderType === 'Admin') {
            return 'You (Admin)';
        }
        return user.name;
    }

    return (
        <div className="admin-chat-modal-overlay" onClick={onClose}>
            <div className="admin-chat-modal card" onClick={e => e.stopPropagation()}>
                <h3 >Chat with {user.name} ({user.email})</h3>
                <div className="chat-messages admin-chat-messages">
                     {isLoading && <p>Loading messages...</p>}
                    {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                    {!isLoading && messages.length === 0 && <p>No messages yet.</p>}
                    {messages.map((msg): React.ReactNode => (
                        <div key={msg._id} className={`message ${msg.senderType === 'User' ? 'user' : 'admin'}`}>
                          <div className="message-meta">
                              <strong>{getSenderName(msg)}</strong> - {formatDate(msg.createdAt)}
                          </div>
                            {msg.messageText}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendReply} className="chat-input-area">
                     <input
                        type="text"
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="input-field"
                        disabled={isSending}
                    />
                    <button type="submit" className="button chat-send-button" disabled={isSending}>
                        {isSending ? '...' : <Send size={20} />}
                    </button>
                </form>
                 <button onClick={onClose} className="button-outline" style={{marginTop: '1rem', width: '100%'}}>
                    Close Chat
                </button>
            </div>
        </div>
    );
};
// --- END AdminChatModal Component ---


interface SupportMessagesProps {
  usersWithUnread: UserWithUnread[];
  // --- 1. ADD NEW PROP ---
  usersWithRead: UserWithUnread[];
  currentAdminId: string | undefined;
}

const SupportMessages: React.FC<SupportMessagesProps> = ({ 
  usersWithUnread, 
  // --- 2. ACCEPT NEW PROP ---
  usersWithRead, 
  currentAdminId 
}) => {
  const [selectedUser, setSelectedUser] = useState<UserWithUnread | null>(null);
  
  const [unreadList, setUnreadList] = useState(usersWithUnread || []);
  // --- 3. ADD NEW STATE ---
  const [readList, setReadList] = useState(usersWithRead || []);

  useEffect(() => {
    setUnreadList(usersWithUnread || []);
  }, [usersWithUnread]);

  // --- 4. ADD NEW EFFECT ---
  useEffect(() => {
    setReadList(usersWithRead || []);
  }, [usersWithRead]);


  const handleViewAndMarkRead = (user: UserWithUnread) => {
    setSelectedUser(user);

    // --- 5. UPDATE THIS FUNCTION ---
    // Optimistically move user from 'unread' to 'read'
    setUnreadList(prevList => prevList.filter(u => u._id !== user._id));
    // Add to the top of the 'read' list
    setReadList(prevList => [user, ...prevList.filter(u => u._id !== user._id)]); 
    // --- END UPDATE ---

    try {
      fetch(`http://localhost:4000/api/admin/support/messages/mark-read/${user._id}`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  return (
    <>
      {/* --- UNREAD MESSAGES TABLE (Unchanged) --- */}
      <div className="table-wrapper">
         <div style={{ padding: '1rem', paddingTop: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Support Messages</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>Users with unread messages.</p>
        </div>
        <table className="table">
            <thead className="table-header">
                <tr className="table-row">
                    <th className="table-head">User Name</th>
                    <th className="table-head">Email</th>
                    <th className="table-head">Actions</th>
                </tr>
            </thead>
            <tbody className="table-body">
                {unreadList.length === 0 ? (
                    <tr className="table-row">
                        <td colSpan={3} className="table-cell" style={{ textAlign: 'center', color: '#6b7280' }}>
                            No users with unread support messages found.
                        </td>
                    </tr>
                ) : (
                    unreadList.map(user => (
                        <tr key={user._id} className="table-row">
                            <td className="table-cell">
                                {user.name}
                                <span className="status-badge status-pending" style={{marginLeft: '0.5rem', fontSize: '0.7rem'}}>
                                  New
                                </span>
                            </td>
                            <td className="table-cell">{user.email}</td>
                            <td className="table-cell">
                                <button
                                    className="table-action-button"
                                    onClick={() => handleViewAndMarkRead(user)}
                                >
                                    <MessageSquareText size={16} style={{ marginRight: '0.5rem' }} />
                                    View & Reply
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* --- 6. ADD NEW "PREVIOUS CHATS" TABLE --- */}
      <div className="table-wrapper" style={{ marginTop: '3rem' }}>
         <div style={{ padding: '1rem', paddingTop: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Previous Chats</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>Users you have already replied to.</p>
        </div>
        <table className="table">
            <thead className="table-header">
                <tr className="table-row">
                    <th className="table-head">User Name</th>
                    <th className="table-head">Email</th>
                    <th className="table-head">Actions</th>
                </tr>
            </thead>
            <tbody className="table-body">
                {readList.length === 0 ? (
                    <tr className="table-row">
                        <td colSpan={3} className="table-cell" style={{ textAlign: 'center', color: '#6b7280' }}>
                            No previous chat history found.
                        </td>
                    </tr>
                ) : (
                    readList.map(user => (
                        <tr key={user._id} className="table-row">
                            <td className="table-cell">
                                {user.name}
                            </td>
                            <td className="table-cell">{user.email}</td>
                            <td className="table-cell">
                                <button
                                    className="table-action-button"
                                    onClick={() => setSelectedUser(user)} // Just open the modal
                                >
                                    <MessageSquareText size={16} style={{ marginRight: '0.5rem' }} />
                                    View History
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
      {selectedUser && (
        <AdminChatModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          currentAdminId={currentAdminId}
        />
      )}
    </>
  );
};

export default SupportMessages;