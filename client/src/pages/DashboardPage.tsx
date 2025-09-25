import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateLinkForm from '../components/CreateLinkForm';
import apiClient from '../apiClient';

type Link = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

const DashboardPage = () => {
  // --- CONTEXT ---
  // We now pull the isAuthLoading "traffic light" state from our context.
  const { user, token, logout, isAuthLoading } = useAuth();
  
  // --- STATE ---
  const [links, setLinks] = useState<Link[]>([]);
  // To avoid confusion, we'll rename this state to be more specific.
  // It tracks the loading of *link data*, not the auth state.
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING EFFECT ---
  useEffect(() => {
    const fetchLinks = async () => {
      // --- NEW GUARD CLAUSES (The Traffic Light Logic) ---

      // 1. If the auth state is still being checked (light is red), do nothing.
      //    This effect will re-run automatically when isAuthLoading becomes false.
      if (isAuthLoading) {
        return;
      }
      
      // 2. If the auth check is finished AND there's no token, we know for sure
      //    the user is logged out. We can stop loading and just show an empty dashboard.
      if (!token) {
        setIsDataLoading(false);
        return;
      }

      // If we get past the guards, we know the light is green and we have a token.
      // It's now safe to make the API call.
      try {
        const response = await apiClient.get('/api/links');
        setLinks(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchLinks();
    // This effect now depends on both the token AND our new traffic light.
  }, [token, isAuthLoading]);

  // --- EVENT HANDLERS (No changes needed here) ---
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

  // --- CONDITIONAL RENDER ---
  // The main loading indicator now waits for BOTH auth to be ready AND data to be fetched.
  if (isAuthLoading || isDataLoading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  // --- JSX RENDER (No changes needed here) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">My Links</h1>
          <div>
            <span className="text-sm text-gray-600 mr-4">Welcome, {user?.email}!</span>
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
        <CreateLinkForm onLinkCreated={handleLinkCreated} />
        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-6">{error}</p>}
        <div className="bg-white shadow rounded-lg">
          <ul className="divide-y divide-gray-200">
            {links.length > 0 ? (
              links.map((link) => (
                <li key={link.id} className="p-4 flex justify-between items-center">
                  <div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">
                      {link.title}
                    </a>
                    <p className="text-sm text-gray-500">{link.url}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(link.id)}
                    className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200"
                  >
                    Delete
                  </button>
                </li>
              ))
            ) : (
              <p className="p-4 text-gray-500">You haven't created any links yet. Add one above!</p>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;