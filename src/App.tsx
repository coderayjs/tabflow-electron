import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { seedDatabase } from './utils/seedData';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Seed database first
        await seedDatabase();
        console.log('Database seeded successfully');
      } catch (error) {
        console.error('Error seeding database:', error);
      }

      // Then check authentication
      await checkAuth();
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-xl">Loading TableFlo...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <Navigation />}
      <div className={isAuthenticated ? 'pl-64' : ''}>
        <Routes>
          <Route path="/activation" element={<Activation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/dealers"
            element={isAuthenticated ? <DealerManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/tables"
            element={isAuthenticated ? <TableManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/assignments"
            element={isAuthenticated ? <Assignments /> : <Navigate to="/login" />}
          />
          <Route
            path="/breaks"
            element={isAuthenticated ? <BreakManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/games"
            element={isAuthenticated ? <GameManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/analytics"
            element={isAuthenticated ? <Analytics /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

