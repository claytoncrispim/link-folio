// We only need specific hooks from React, not the whole library.
import { useState } from 'react';
// These hooks from React Router help us navigate between pages.
import { useNavigate, Link } from 'react-router-dom';
// This is our custom, pre-configured Axios instance for talking to the server.
import apiClient from '../apiClient';

const RegisterPage = () => {
  // --- STATE MANAGEMENT ---
  // 'useState' gives our component a "memory" for values that can change.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate(); // This function lets us programmatically change pages.

  // --- EVENT HANDLER ---
  // This function runs when the user submits the form.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser from doing a full page reload on submit.
    setError(null);     // Clear any previous errors.
    setSuccess(null);

    try {
      // --- THE API CALL ---
      // We use our apiClient to send a POST request to the server.
      // THE FIX: The path MUST include the "/api" prefix our server expects.
      await apiClient.post('/api/users', { email, password });
      
      // If the request succeeds, we show a success message...
      setSuccess('Registration successful! Please log in.');
      // ...and then redirect to the login page after a short delay.
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) in {
      // If anything goes wrong, we catch the error and display it to the user.
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  // --- JSX (The Component's UI) ---
  // This is the HTML structure of our page.
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