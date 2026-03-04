// resalesense-frontend/src/pages/CustomerSupportPage/CustomerSupportPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CustomerSupportPage.css';
import { Send } from 'lucide-react';

interface ChatMessage {
  _id: string; 
  senderType: 'Admin' | 'User';
  messageText: string;
  createdAt: string; 
  adminId?: { 
      name: string;
  };
}

const CustomerSupportPage: React.FC = () => {
  const { currentUser, isAuthLoading } = useAuth(); 
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null); 

  // --- 1. THIS FUNCTION IS NOW FIXED ---
  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);

    // --- 2. GREETING MOVED OUTSIDE ---
    // Define the greeting message here so both 'if' and 'else' can use it.
    const greetingMessage: ChatMessage = {
      _id: 'greeting-0',
      senderType: 'Admin',
      messageText: 'Hello! How can I assist you today?',
      createdAt: new Date().toISOString(), 
    };

    try {
      const response = await fetch(`http://localhost:4000/api/support/messages/${currentUser.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat history.');
      }
      let fetchedMessages: ChatMessage[] = await response.json();

      if (fetchedMessages.length === 0) {
        setMessages([greetingMessage]); 
      } else {
        // --- 3. THIS IS THE FIX ---
        // Prepend the greeting to the start of the fetched messages
        setMessages([greetingMessage, ...fetchedMessages]); 
      }
    } catch (err: any) {
      setError(err.message);
      setMessages([greetingMessage]); // Show greeting even if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); 
  // --- END OF FIX ---

  useEffect(() => {
    if (isAuthLoading) return; 

    if (!currentUser) {
      alert('Please log in to access Customer Support.');
      navigate('/login');
    } else {
      fetchMessages(); 
    }
  }, [currentUser, isAuthLoading, navigate, fetchMessages]); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;
    const textToSend = message;
    setMessage(''); 
    try {
      const response = await fetch('http://localhost:4000/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          messageText: textToSend,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message.');
      }
      await fetchMessages(); // This will now work correctly
    } catch (err: any) {
      console.error("Error sending support message:", err);
      alert(`Error: ${err.message}`);
      setMessage(textToSend); 
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-SG', {
        hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short'
    });
  }

  const getSenderName = (msg: ChatMessage) => {
    if (msg.senderType === 'Admin') {
      return msg.adminId?.name || 'Admin'; 
    }
    return 'You';
  }

  if (isAuthLoading || !currentUser) {
    return <div className="support-page-wrapper"><p>Loading...</p></div>;
  }

  return (
    <div className="support-page-wrapper">
      <h1 className="support-header">Chat with Support</h1>

      <div className="chat-container card">
        <div className="chat-messages">
          {isLoading && <p>Loading messages...</p>}
          {error && <p className="form-error">{error}</p>}
          
          {messages.map((msg) => (
            <div key={msg._id} className={`message ${msg.senderType === 'Admin' ? 'admin' : 'user'}`}>
              <div className="message-meta">
                <strong>{getSenderName(msg)}</strong> - {formatDate(msg.createdAt)}
              </div>
              {msg.messageText}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field"
          />
          <button type="submit" className="button chat-send-button" disabled={isLoading}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerSupportPage;