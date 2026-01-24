import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import { MatchOverlay } from './components/match';
import { DiscoverPage, ProfilePage, SavedPage, InboxPage, OnboardingPage } from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* Match Overlay (global) */}
      <MatchOverlay />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(15, 26, 35, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#0079d6',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Routes */}
      <Routes>
        {/* Onboarding (no bottom nav) */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* Main App with Bottom Nav */}
        <Route element={<AppShell />}>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
