import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ensureApiStartupCheck, useApiStartupStatus } from './apiClient';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// A simple component for our home page
const HomePage = () => (
  <div className="text-center p-10 text-gray-100">
    <h1 className="text-4xl font-bold">Welcome to LinkFolio</h1>
    <p className="mt-4 text-gray-300">Your personal link-sharing hub.</p>
    <div className="mt-6 space-x-4">
      <Link to="/login" className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Login</Link><br></br>
      <Link to="/register" className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700">Register</Link>
    </div>
  </div>
);

// A special component to protect routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="p-10 text-center text-gray-600">Loading your session...</div>;
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};


function App() {
  const startupStatus = useApiStartupStatus();

  useEffect(() => {
    ensureApiStartupCheck();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-950 px-4 py-6">
        {startupStatus.checked && !startupStatus.ok && (
          <div className="mx-auto mb-4 w-full max-w-5xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Local API connection warning</p>
            <p className="mt-1">{startupStatus.message}</p>
          </div>
        )}

        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-300 bg-gray-900 shadow-sm">
          <header className="border-b border-gray-700 bg-gray-900/90 px-6 py-4">
            <Link to="/" className="text-xl font-bold tracking-wide text-gray-100 hover:text-indigo-300">
              LinkFolio - Your Personal Link Hub
            </Link>
          </header>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
