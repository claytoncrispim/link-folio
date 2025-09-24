import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient'; // <-- Our custom API client that simplifies requests

const LoginPage = () => {
  // --- STATE MANAGEMENT ---
  // We use useState to keep track of what the user types in the input fields.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // This state holds any error messages we want to show to the user.
  const [error, setError] = useState<string | null>(null);

  // --- HOOKS ---
  // useAuth gives us access to the login function from our global AuthContext.
  const { login } = useAuth();
  // useNavigate allows us to programmatically redirect the user to other pages.
  const navigate = useNavigate();

  // This function runs when the user submits the form.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser from doing a full page refresh.
    setError(null); // Clear any previous errors.

    try {
      // --- API CALL ---
      // We use our apiClient to make a POST request to the server's login endpoint.
      // It's clean because it handles the full URL and content type for us.
      const response = await apiClient.post('/api/auth/login', { email, password });

      // With Axios (which our apiClient uses), the server's JSON response is on the .data property.
      const data = response.data;

      // --- DECODE TOKEN & UPDATE CONTEXT ---
      // We need user data for our context. We can decode it from the JWT payload.
      // The payload is the middle part of the token (between the two dots).
      const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
      const userData = { id: decodedToken.userId, email: email };

      // Call the login function from our AuthContext. This updates the global state
      // and saves the token to localStorage, making the user "logged in" across the app.
      login(data.token, userData);
      
      // --- NAVIGATION ---
      // On successful login, redirect the user to their dashboard.
      navigate('/dashboard');

    } catch (err: any) {
      // If the server sends an error (e.g., "Invalid credentials"), we display it.
      setError(err.response?.data?.error || err.message || 'Failed to log in');
    }
  };

  // --- JSX RENDER ---
  // This is the HTML structure of our login form.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Log in to your Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Log in
            </button>
          </div>
        </form>
        {/* Conditionally render the error message if it exists */}
        {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;