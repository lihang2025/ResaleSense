import React, { 
  useState, 
  useContext, 
  createContext, 
  ReactNode, 
  useEffect, 
  useMemo,        // Import useMemo
  useCallback     // Import useCallback
} from 'react';

export interface Warning {
  _id: string; 
  message: string;
  issuedAt: string;
  read: boolean;
}

// --- User Interface ---
export interface User {
  id: string;
  name: string;
  email: string;
  bookmarks: number[];
  role: 'Consumer' | 'Admin';
  warnings: Warning[];
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  
  // --- 1. THIS LINE WAS MISSING ---
  status: 'active' | 'flagged' | 'banned'; 
}

// --- Context Type ---
interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateBookmarks: (bookmarks: number[]) => void;
  dismissWarning: (warningId: string) => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- 1. useEffect (This is the safer version from before) ---
  useEffect(() => {
    console.log("AuthContext: useEffect running...");
    try {
      const storedUser = localStorage.getItem('resaleSenseUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        let needsUpdate = false;
        
        // Check for warnings
        if (!user.warnings || !Array.isArray(user.warnings)) {
          console.log("AuthContext: Migrating invalid user. Re-adding 'warnings' array.");
          user.warnings = []; 
          needsUpdate = true;
        }
        
        // Check for verificationStatus
        if (!user.verificationStatus) {
          console.log("AuthContext: Migrating invalid user. Adding default 'verificationStatus'.");
          user.verificationStatus = 'unverified'; // Default to unverified
          needsUpdate = true;
        }

        // --- 2. THIS CHECK WAS MISSING ---
        // Check for status
        if (!user.status) {
          console.log("AuthContext: Migrating invalid user. Adding default 'status: active'.");
          user.status = 'active'; // Default to active
          needsUpdate = true;
        }
        // --- END FIX ---

        if (needsUpdate) {
         console.log("AuthContext: Saving migrated user to localStorage.");
         localStorage.setItem('resaleSenseUser', JSON.stringify(user));
        }

        setCurrentUser(user);
        console.log("AuthContext: User loaded from localStorage.");
      } else {
        console.log("AuthContext: No user in localStorage.");
      }
    } catch (e) {
      console.error("AuthContext: Failed to parse user", e);
      localStorage.removeItem('resaleSenseUser');
      setCurrentUser(null);
    } finally {
      setIsAuthLoading(false);
      console.log("AuthContext: isAuthLoading set to false.");
    }
  }, []); // Empty dependency array ensures this runs only ONCE

  // --- 2. ALL CALLBACK FUNCTIONS ARE DEFINED FIRST ---
  const login = useCallback((userData: User) => {
    // Ensure all fields are present on login
    const completeUserData = {
      ...userData,
      warnings: userData.warnings || [],
      verificationStatus: userData.verificationStatus || 'unverified',
      status: userData.status || 'active',
    };
    localStorage.setItem('resaleSenseUser', JSON.stringify(completeUserData));
    setCurrentUser(completeUserData);
  }, []); 

  const logout = useCallback(() => {
    localStorage.removeItem('resaleSenseUser');
    setCurrentUser(null);
  }, []); 

  const updateBookmarks = useCallback((bookmarks: number[]) => {
    setCurrentUser(prevUser => {
      if (prevUser) {
        const updatedUser = { ...prevUser, bookmarks };
        localStorage.setItem('resaleSenseUser', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return null;
    });
  }, []);

  const dismissWarning = useCallback((warningId: string) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      
      const updatedWarnings = prevUser.warnings.map(w => 
        w._id === warningId ? { ...w, read: true } : w
      );
      
      const updatedUser = { ...prevUser, warnings: updatedWarnings };
      localStorage.setItem('resaleSenseUser', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // --- 3. useMemo IS DEFINED LAST (after all functions) ---
  const value = useMemo(() => ({
    currentUser,
    isAuthLoading,
    login,
    logout,
    updateBookmarks,
    dismissWarning,
  }), [currentUser, isAuthLoading, login, logout, updateBookmarks, dismissWarning]);

  console.log("AuthContext: Rendering provider. isAuthLoading:", isAuthLoading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};