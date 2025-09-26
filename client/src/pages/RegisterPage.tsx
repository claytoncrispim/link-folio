import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../apiClient';

const RegisterPage = () => {
  // --- STATE MANAGEMENT ---
  // We use 'useState' to give our component a "memory" for things that can change.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // 'useNavigate' is a hook from React Router to programmatically change pages.
  const navigate = useNavigate();

  // --- EVENT HANDLER ---
  // This function runs when the user submits the form.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the default browser action of a full page reload.
    setError(null);
    setSuccess(null);

    try {
      // --- THE API CALL ---
      // We send a POST request to our server's registration endpoint.
      // THE FIX: The path MUST include the "/api" prefix our server expects.
      const response = await apiClient.post('/api/users', { email, password });

      // If the request is successful, show a success message.
      setSuccess(response.data.message || 'Registration successful! Please log in.');
      
      // Wait 2 seconds before redirecting to give the user time to read the message.
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      // If the API call fails (e.g., user already exists), we catch the error here.
      // We display the specific error message from the server if it exists.
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  // --- JSX (The Component's UI) ---
  // This is what the component will render to the screen.
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
        {/* These lines conditionally render the error or success messages */}
        {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-center text-green-600">{success}</p>}
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          {/* The <Link> component provides client-side navigation without a full page reload */}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;