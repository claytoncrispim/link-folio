import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../apiClient'; // <-- Use our new API client

const RegisterPage = () => {
  // --- STATE MANAGEMENT ---
  // We track the user's input for email and password.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // We also have state for holding success or error messages.
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // --- HOOKS ---
  // This hook lets us redirect the user after they register.
  const navigate = useNavigate();

  // This function runs when the user clicks the "Register" button.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from reloading.
    // Reset messages from any previous attempts.
    setError(null);
    setSuccess(null);

    try {
      // --- API CALL ---
      // Make a POST request to our '/api/users' endpoint to create a new user.
      await apiClient.post('/users', { email, password });
      
      // --- SUCCESS HANDLING ---
      // If the request was successful, show a success message.
      setSuccess('Registration successful! Please log in.');
      
      // Wait for 2 seconds before redirecting to give the user time to read the message.
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      // --- ERROR HANDLING ---
      // If the API call fails (e.g., user already exists), we get the error
      // from the server's response and display it to the user.
      setError(err.response?.data?.error || err.message || 'Failed to register');
    }
  };

  // --- JSX RENDER ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Create an Account</h2>
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
              Register
            </button>
          </div>
        </form>
        {/* Conditionally render our error and success messages */}
        {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-center text-green-600">{success}</p>}
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;