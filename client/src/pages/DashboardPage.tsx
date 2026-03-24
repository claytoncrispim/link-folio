import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateLinkForm from '../components/CreateLinkForm';
import RequestStatusNotice from '../components/RequestStatusNotice';
import apiClient, { useApiRequestStatus } from '../apiClient';

// A 'type' defines the shape of our data. It helps prevent bugs.
type Link = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

const DashboardPage = () => {
  const { user, token, logout, isAuthLoading } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestStatus = useApiRequestStatus();

  useEffect(() => {
    const fetchLinks = async () => {
      if (isAuthLoading) return;

      if (!token) {
        setIsDataLoading(false);
        return;
      }
      try {
        // --- THE API CALL ---
        // THE FIX: The path MUST include the "/api" prefix.
        const response = await apiClient.get('/api/links');
        setLinks(response.data); // Update our state with the fetched links.
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
      } finally {
        // This runs whether the fetch succeeded or failed.
        setIsDataLoading(false);
      }
    };

    fetchLinks();
  }, [token, isAuthLoading]);

  const handleLinkCreated = (newLink: Link) => {
    setLinks(prevLinks => [newLink, ...prevLinks]);
  };

  const handleDelete = async (linkId: string) => {
    const originalLinks = links;
    setLinks(links.filter(link => link.id !== linkId));
    try {
      await apiClient.delete(`/api/links/${linkId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete link.');
      setLinks(originalLinks);
    }
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-700 bg-gray-900 p-6 text-center shadow-sm">
          {(requestStatus.phase === 'requesting' || requestStatus.phase === 'warming' || requestStatus.phase === 'retrying') && (
            <RequestStatusNotice status={requestStatus} className="mb-4" />
          )}
          <p className="text-lg font-semibold text-gray-100">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-gray-400">
            {requestStatus.phase === 'idle'
              ? 'Fetching your saved links and preparing the session.'
              : requestStatus.detail}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="border-b border-gray-700 bg-gray-900 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-100">My Links</h1>
          <div>
            <span className="text-sm text-gray-300 mr-4">Welcome, {user?.email}!</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {requestStatus.phase !== 'idle' && <RequestStatusNotice status={requestStatus} className="mb-6" compact={requestStatus.phase === 'success'} />}
        <CreateLinkForm onLinkCreated={handleLinkCreated} />
        {error && <p className="mb-6 rounded-md border border-red-700 bg-red-950/60 p-3 text-red-300">{error}</p>}
        <div className="rounded-lg border border-gray-700 bg-gray-900 shadow">
          <ul className="divide-y divide-gray-800">
            {links.length > 0 ? (
              links.map((link) => (
                <li key={link.id} className="p-4 flex justify-between items-center">
                  <div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-400 hover:underline">
                      {link.title}
                    </a>
                    <p className="text-sm text-gray-400">{link.url}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="rounded-full bg-red-900/60 px-3 py-1 text-sm font-medium text-red-200 hover:bg-red-800/70"
                  >
                    Delete
                  </button>
                </li>
              ))
            ) : (
              <p className="p-4 text-gray-400">You haven't created any links yet. Add one above!</p>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;