import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient, { useApiRequestStatus } from '../apiClient';
import RequestStatusNotice from '../components/RequestStatusNotice';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const requestStatus = useApiRequestStatus();

  const buttonLabel = !isSubmitting
    ? 'Register'
    : requestStatus.phase === 'warming'
      ? 'Waking server...'
      : requestStatus.phase === 'retrying'
        ? 'Retrying...'
        : 'Creating account...';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/api/users', { email, password });
      setSuccess(response.data.message || 'Registration successful! Please log in.');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 space-y-6 rounded-lg border border-gray-700 bg-gray-900 shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-100">Create an Account</h2>
        {isSubmitting && <RequestStatusNotice status={requestStatus} />}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 mt-1 rounded-md border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 mt-1 rounded-md border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {buttonLabel}
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-sm text-center text-red-300">{error}</p>}
        {success && <p className="mt-4 text-sm text-center text-emerald-300">{success}</p>}
        <p className="mt-4 text-sm text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;