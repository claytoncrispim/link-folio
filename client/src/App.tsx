import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// A simple component for our home page
const HomePage = () => (
  <div className="text-center p-10">
    <h1 className="text-4xl font-bold">Welcome to LinkFolio</h1>
    <p className="mt-4">Your personal link-sharing hub.</p>
    <div className="mt-6 space-x-4">
      <Link to="/login" className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Login</Link><br></br>
      <Link to="/register" className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700">Register</Link>
    </div>
  </div>
);

// A placeholder for our protected dashboard page
const DashboardPage = () => {
  const { user, logout } = useAuth();
  return (
    <div className="text-center p-10">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome, {user?.email}!</p>
      <button 
        onClick={logout}
        className="mt-6 px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
};

// A special component to protect routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) {
    // If there's no token, redirect to the login page
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};


function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
