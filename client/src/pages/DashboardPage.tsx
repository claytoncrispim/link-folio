import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateLinkForm from '../components/CreateLinkForm';

// It's good practice to define a 'type' for our data structures.
// This gives us better autocompletion and error checking with TypeScript.
type Link = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

const DashboardPage = () => {
  // 1. Get our authentication token from the AuthContext.
  const { user, token, logout } = useAuth();
  
  // 2. Set up our component's "memory" (state) using useState.
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. This is our "Mission Control" for side effects.
  // This useEffect fetches the links when the component loads
  useEffect(() => {
    // This is the "Mission": a function to fetch the links.
    const fetchLinks = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/links`, {
          method: 'GET',
          headers: {
            // We prove our identity by including our JWT in the Authorization header.
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch links.');
        }

        const data: Link[] = await response.json();
        setLinks(data); // Update our state with the fetched links
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false); // We're done loading, whether it succeeded or failed.
      }
    };

    fetchLinks();
  }, [token]); // 4. This is the "Launch Condition": run this mission only when the token changes.

  // This is our callback function that the form will call
  const handleLinkCreated = (newLink: Link) => {
    // Add the new link to the top of our list instantly!
    setLinks(prevLinks => [newLink, ...prevLinks]);
  };

  const handleDelete = async (linkId: string) => {
    if (!token) return;

    // Optimistic UI: Remove the link from the list immediately for a snappy feel.
    const originalLinks = links;
    setLinks(links.filter(link => link.id !== linkId));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If the delete fails on the server, revert the UI change.
        setLinks(originalLinks);
        throw new Error('Failed to delete link.');
      }
      // If successful, the UI is already correct!

    } catch (err: any) {
      setError(err.message);
      // Revert UI on error
      setLinks(originalLinks);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading...</div>;
  }

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

        {/* <-- We are now rendering our form component here and passing the callback function as a prop */}
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
              // <-- NEW: A small text change here for a better user experience
              <p className="p-4 text-gray-500">You haven't created any links yet. Add one above!</p>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
