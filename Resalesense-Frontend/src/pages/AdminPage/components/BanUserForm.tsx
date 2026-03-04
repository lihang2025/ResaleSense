// resalesense-frontend/src/pages/AdminPage/components/BanUserForm.tsx
import React, { useState, useEffect } from 'react';
import * as Label from '@radix-ui/react-label';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

// We don't need the LoginPage.css import
// import '../../LoginPage/LoginPage.css'; 

interface BanUserFormProps {
  onBanUser: (userQuery: string, duration: string) => void;
  isSubmitting: boolean;
  initialUserQuery?: string;
  onCancel: () => void; // <-- Add onCancel to props
}

const BanUserForm: React.FC<BanUserFormProps> = ({ onBanUser, isSubmitting, initialUserQuery, onCancel }) => {
  const [userQuery, setUserQuery] = useState('');
  const [duration, setDuration] = useState('7-days'); 

  useEffect(() => {
    if (initialUserQuery) {
      setUserQuery(initialUserQuery);
    }
  }, [initialUserQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery || !duration) {
      alert("Please provide both a User ID/Name and a ban duration.");
      return;
    }
    onBanUser(userQuery, duration);
    // Don't clear form here, AdminPage.tsx will hide this component
  };

  const handleCancel = () => {
    setUserQuery('');
    setDuration('7-days');
    onCancel(); // Call the onCancel prop to go back
  };

  return (
    <div className="card login-card" style={{ maxWidth: '500px', margin: '0 auto 2rem auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
        Ban a User
      </h2>

     <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <Label.Root className="form-label" htmlFor="userQuery">
              User ID or Name
            </Label.Root>
            <input
              id="userQuery"
              type="text"
              placeholder="Enter User ID or Name"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              required
              className="input-field"
            />
          </div>

        <div className="form-group">
          <Label.Root className="form-label" htmlFor="duration">
            Ban Duration
          </Label.Root>
          <Select.Root value={duration} onValueChange={setDuration}>
            <Select.Trigger id="duration" className="select-trigger">
              <Select.Value placeholder="Select a duration" />
              <Select.Icon><ChevronDown size={16} /></Select.Icon>
            </Select.Trigger>
            
            <Select.Portal>
              <Select.Content className="select-content">
                {/* --- FIX: ADDED Select.Viewport --- */}
                <Select.Viewport>
                  <Select.Item className="select-item" value="1-day">
                    <Select.ItemText>1 Day</Select.ItemText>
                    <Select.ItemIndicator className="select-item-indicator"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                  <Select.Item className="select-item" value="7-days">
                    <Select.ItemText>7 Days</Select.ItemText>
                    <Select.ItemIndicator className="select-item-indicator"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                  <Select.Item className="select-item" value="30-days">
                    <Select.ItemText>30 Days</Select.ItemText>
                    <Select.ItemIndicator className="select-item-indicator"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                  <Select.Item className="select-item" value="permanent">
                    <Select.ItemText>Permanent</Select.ItemText>
                    <Select.ItemIndicator className="select-item-indicator"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                </Select.Viewport>
                {/* --- END FIX --- */}
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

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
            {isSubmitting ? 'Banning...' : 'Confirm Ban'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BanUserForm;