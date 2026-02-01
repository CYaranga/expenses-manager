import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useEffect, useRef } from 'react';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ExpensesPage from './pages/ExpensesPage';
import { activityLogger } from './lib/logger';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RouteTracker() {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    const pageName = location.pathname === '/' ? 'Expenses' :
                     location.pathname === '/login' ? 'Login' :
                     location.pathname;

    activityLogger.trackPageView(pageName, {
      path: location.pathname,
      search: location.search,
    });

    if (previousPath.current && previousPath.current !== location.pathname) {
      activityLogger.trackNavigation(previousPath.current, location.pathname);
    }

    previousPath.current = location.pathname;
  }, [location]);

  return null;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <RouteTracker />
      <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ExpensesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
