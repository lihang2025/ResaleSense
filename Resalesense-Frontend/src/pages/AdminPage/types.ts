// src/pages/AdminPage/types.ts

export interface PendingRemark {
  _id: string;
  text: string;
  valuationVote?: string;
  status: 'pending';
  createdAt: string;
  isEdited: boolean;
  communityValuation?: number;
  town: string; // <-- ADDED THIS LINE
  
  userId: {
    _id: string;
    name: string;
  } | null;
  
  propertyId: {
    _id: number;
    resale_price: number;
    block: string;
    street_name: string;
  } | null;
}
// This interface was also in AdminPage.tsx
export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: 'Consumer' | 'Admin';
  status: 'active' | 'flagged' | 'banned';
  createdAt: string;
  // --- ADD THESE TWO LINES ---
  banDuration?: string;
  banExpiresAt?: Date;
}

export interface PendingVerification {
  _id: string;
  name: string;
  email: string;
  createdAt: string; // Or verificationRequestedAt
  verificationStatus: 'pending' | 'unverified'; // <-- ADD THIS
}

export interface UserWithUnread {
  _id: string;
  name: string;
  email: string;
  // We might add a count of unread messages later
}

// UPDATED: SupportMessage to match backend model
export interface SupportMessage {
  _id: string;
  userId: { // Assume it's always populated with these details
    _id: string;
    name: string;
    email: string; // Ensure email is part of the required type
  };
  // --- END CHANGE ---
  senderType: 'User' | 'Admin';
  adminId?: { // Also good to assume populated if present
    _id: string;
    name: string;
  };
  messageText: string;
  isReadByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}
