import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateLinkForm from '../components/CreateLinkForm';
import apiClient from '../apiClient';

// A 'type' defines the shape of our data. It helps prevent bugs.
type Link = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

const DashboardPage = () => {
  // --- CONTEXT & STATE ---
  // Get everything we need from our global AuthContext.
  const { user, token, logout, isAuthLoading } = useAuth();
  
  // Local state for this component to manage the links and loading status.
  const [links, setLinks] = useState<Link[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true); // Manages loading state for the links data specifically
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING (EFFECT) ---
  // 'useEffect' runs code after the component renders. It's for "side effects" like fetching data.
  useEffect(() => {
    const fetchLinks = async () => {
      // Don't do anything if the auth context is still loading its state.
      if (isAuthLoading) return;

      // If auth is ready but there's no token, we know the user isn't logged in.
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
  }, [token, isAuthLoading]); // This effect re-runs ONLY if the token or auth loading status changes.

  // --- CALLBACKS & HANDLERS ---
  // This function is passed down to the CreateLinkForm component.
  const handleLinkCreated = (newLink: Link) => {
    // This provides an "optimistic update" - the UI updates instantly.
    setLinks(prevLinks => [newLink, ...prevLinks]);
  };

  const handleDelete = async (linkId: string) => {
    const originalLinks = links;
    setLinks(links.filter(link => link.id !== linkId)); // Optimistically remove from UI.
    try {
      // --- THE API CALL ---
      // THE FIX: The path MUST include the "/api" prefix.
      await apiClient.delete(`/api/links/${linkId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete link.');
      setLinks(originalLinks); // If the delete fails, put the link back in the UI.
    }
  };

  // --- CONDITIONAL RENDERING ---
  // Show a loading message while we wait for auth state OR data to be ready.
  if (isAuthLoading || isDataLoading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  // --- JSX (The Component's UI) ---
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