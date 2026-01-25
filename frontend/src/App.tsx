import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, ProtectedRoute } from './components/auth';
import { MatchOverlay } from './components/match';
import { DiscoverPage, ProfilePage, SavedPage, InboxPage, OnboardingPage, CreateListingPage, LoginPage } from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Onboarding (requires auth, but not onboarding completion) */}
          <Route path="/onboarding" element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingPage />
            </ProtectedRoute>
          } />

          {/* Create/Edit Listing (protected) */}
          <Route path="/listings/create" element={
            <ProtectedRoute>
              <CreateListingPage />
            </ProtectedRoute>
          } />
          <Route path="/listings/:listingId/edit" element={
            <ProtectedRoute>
              <CreateListingPage />
            </ProtectedRoute>
          } />

          {/* Main App with Bottom Nav (protected) */}
          <Route element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
            <Route path="/" element={<DiscoverPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
