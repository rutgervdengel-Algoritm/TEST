import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { Organization, AuthState } from './types';
import { authApi, setAuthToken } from './utils/api';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Waitlist from './pages/Waitlist';
import EntryForm from './pages/EntryForm';
import Rules from './pages/Rules';
import NewSpot from './pages/NewSpot';
import Matches from './pages/Matches';
import DecisionLog from './pages/DecisionLog';
import Analytics from './pages/Analytics';
import ParentPortal from './pages/ParentPortal';
import ParentDashboard from './pages/ParentDashboard';
import ImportExport from './pages/ImportExport';

// Auth Context
interface AuthContextType extends AuthState {
  login: (token: string, org: Organization) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main App
export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    organization: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  const login = useCallback((token: string, organization: Organization) => {
    setAuthToken(token);
    setAuthState({
      token,
      organization,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setAuthState({
      token: null,
      organization: null,
      isAuthenticated: false,
    });
  }, []);

  const checkAuth = useCallback(async () => {
    if (!authState.token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.me();
      setAuthState(prev => ({
        ...prev,
        organization: response.organization as Organization,
      }));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [authState.token, logout]);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, checkAuth }}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Parent portal routes */}
        <Route path="/mijn-inschrijvingen" element={<ParentDashboard />} />
        <Route path="/portaal" element={<ParentPortal />} />
        <Route path="/portaal/:accessCode" element={<ParentPortal />} />
        {/* Legacy routes (redirect) */}
        <Route path="/portal" element={<Navigate to="/portaal" replace />} />
        <Route path="/portal/:accessCode" element={<ParentPortal />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/waitlist" element={
          <ProtectedRoute>
            <Waitlist />
          </ProtectedRoute>
        } />
        <Route path="/waitlist/new" element={
          <ProtectedRoute>
            <EntryForm />
          </ProtectedRoute>
        } />
        <Route path="/waitlist/:id/edit" element={
          <ProtectedRoute>
            <EntryForm />
          </ProtectedRoute>
        } />
        <Route path="/rules" element={
          <ProtectedRoute>
            <Rules />
          </ProtectedRoute>
        } />
        <Route path="/spots/new" element={
          <ProtectedRoute>
            <NewSpot />
          </ProtectedRoute>
        } />
        <Route path="/matches" element={
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        } />
        <Route path="/log" element={
          <ProtectedRoute>
            <DecisionLog />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/import-export" element={
          <ProtectedRoute>
            <ImportExport />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
