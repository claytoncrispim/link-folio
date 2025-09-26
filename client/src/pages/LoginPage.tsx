import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 'useAuth' is our custom hook to access the global authentication state.
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';

const LoginPage = () => {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Get the 'login' function from our AuthContext. This will update the global state.
  const { login } = useAuth();
  const navigate = useNavigate();

  // --- EVENT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // --- THE API CALL ---
      // THE FIX: The path MUST include the "/api" prefix our server expects.
      const response = await apiClient.post('/api/auth/login', { email, password });

      // Decode the JWT to get the user's ID, which we need for the context.
      const decodedToken = JSON.parse(atob(response.data.token.split('.')[1]));
      const userData = { id: decodedToken.userId, email: email };
      
      // Call the global login function to update the app's state and save the token.
      login(response.data.token, userData);
      
      // Redirect the user to their dashboard on successful login.
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log in');
    }
  };

  // --- JSX (The Component's UI) ---
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