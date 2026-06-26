import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeSync } from './components/layout/ThemeSync';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { BandProvider } from './hooks/useBand';
import { ThemeProvider } from './hooks/useTheme';
import { BandHomePage } from './pages/BandHome';
import { LoginPage } from './pages/Login';
import { PracticePage } from './pages/Practice';
import { RegisterPage } from './pages/Register';
import { SettingsPage } from './pages/Settings';
import { SongRecommendPage } from './pages/SongRecommend';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-slate-400">加载中…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <BandProvider>
              <AppLayout />
            </BandProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<BandHomePage />} />
        <Route path="songs" element={<SongRecommendPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ThemeSync />
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
