import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Activation from './components/Activation';
import ForgotPassword from './components/ForgotPassword';
import Help from './components/Help';
import About from './components/About';
import Dashboard from './components/Dashboard';
import DealerManagement from './components/DealerManagement';
import TableManagement from './components/TableManagement';
import Assignments from './components/Assignments';
import BreakManagement from './components/BreakManagement';
import GameManagement from './components/GameManagement';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Navigation from './components/Navigation';
import { useAuthStore } from './stores/authStore';
import { useActivationStore } from './stores/activationStore';
import { seedDatabase } from './utils/seedData';

function AppContent() {
  const { isAuthenticated } = useAuthStore();
  const { isActivated } = useActivationStore();
  const location = useLocation();

  // Pages that should not show the sidebar
  const noSidebarPages = ['/activation', '/login', '/forgot-password'];
  const shouldShowSidebar = isAuthenticated && !noSidebarPages.includes(location.pathname);

  return (
    <>
      {shouldShowSidebar && <Navigation />}
      <div className={shouldShowSidebar ? 'pl-64' : ''}>
        <Routes>
          <Route 
            path="/activation" 
            element={isActivated ? <Navigate to="/login" /> : <Activation />} 
          />
          <Route 
            path="/forgot-password" 
            element={isActivated ? <ForgotPassword /> : <Navigate to="/activation" />} 
          />
          <Route 
            path="/help" 
            element={<Help />} 
          />
          <Route 
            path="/about" 
            element={<About />} 
          />
          <Route
            path="/login"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dealers"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <DealerManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/tables"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <TableManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/assignments"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <Assignments />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/breaks"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <BreakManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/games"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <GameManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/analytics"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <Analytics />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/settings"
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <Settings />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route 
            path="/" 
            element={
              !isActivated ? (
                <Navigate to="/activation" />
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
        </Routes>
      </div>
    </>
  );
}

function App() {
  const { checkAuth } = useAuthStore();
  const { checkActivation } = useActivationStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check activation and auth synchronously (they're fast)
    checkActivation();
    checkAuth();
    
    // Seed database in background (non-blocking)
    // This will return quickly if already seeded
    seedDatabase().catch(error => {
      console.error('Error seeding database:', error);
    });
    
    // Set loading to false immediately after sync checks
    setIsLoading(false);
  }, [checkActivation, checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-xl">Loading TableFlo...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

