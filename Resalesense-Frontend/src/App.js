import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// --- 1. IMPORT THE TOASTER ---
import { Toaster } from 'react-hot-toast';

// Page Imports (Make sure these paths are correct)
import DetailedInsightsPage from './pages/DetailedInsightsPage/DetailedInsightsPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import CreateRemarkPage from './pages/CreateRemarkPage/CreateRemarkPage';
import AdminPage from './pages/AdminPage/AdminPage';
import ComparePage from './pages/ComparePage/ComparePage';
import BookmarksPage from './pages/BookmarksPage/BookmarksPage';
import MapPage from './pages/MapPage/MapPage'; // New two-column layout page
import FullMapPage from './pages/MapPage/FullMapPage'; // Renamed full map page
import FAQPage from './pages/FAQPage/FAQPage';
import CustomerSupportPage from './pages/CustomerSupportPage/CustomerSupportPage';
import LandingPage from './pages/LandingPage/LandingPage';
import TermsPage from './pages/TermsPage/TermsPage';

// Style Import
import './styles.css';

// Context Imports
import { ComparisonProvider } from './context/ComparisonContext';
import { AuthProvider } from './context/AuthContext';

// Component Imports
import ComparisonTray from './components/ComparisonTray';
import Navbar from './components/Navbar';
import { WarningModal } from './components/WarningModal';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ComparisonProvider>
          {/* --- 2. ADD THE TOASTER COMPONENT HERE --- */}
          {/* This component renders the popups */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000, // Popups last for 3 seconds
              style: {
                background: '#333', // Dark background
                color: '#fff', // White text
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              },
              // Success/Error specific styles
              success: {
                style: {
                  background: '#065f46', // Dark Green
                },
              },
              error: {
                style: {
                  background: '#b91c1c', // Dark Red
                },
              },
            }}
          />
          
          <Navbar />
          <Routes>
            {/* --- ROUTE CHANGES --- */}
            <Route path="/" element={<LandingPage />} /> {/* New home page */}
            <Route path="/map" element={<MapPage />} /> {/* Old home page is now /map */}
            <Route path="/terms" element={<TermsPage />} /> {/* New T&C page */}
            <Route path="/full-map" element={<FullMapPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/area/:townName" element={<DetailedInsightsPage />} />
            <Route path="/property/:propertyId" element={<DetailedInsightsPage />} />
            <Route path="/create-remark" element={<CreateRemarkPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/customer-support" element={<CustomerSupportPage />} />
          </Routes>
          <ComparisonTray />
          <WarningModal />
        </ComparisonProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;