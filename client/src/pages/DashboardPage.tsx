import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateLinkForm from '../components/CreateLinkForm';
import apiClient from '../apiClient'; // <-- Use our new API client

// It's good practice to define a 'type' for our data structures.
// This gives us better autocompletion and error checking with TypeScript.
type Link = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

const DashboardPage = () => {
  // --- HOOKS & CONTEXT ---
  // Get authentication details (user, token, logout function) from our global context.
  const { user, token, logout } = useAuth();
  
  // --- STATE MANAGEMENT ---
  // 'links' will hold the array of link objects we get from the server.
  const [links, setLinks] = useState<Link[]>([]);
  // 'isLoading' is a flag to show a "Loading..." message while we fetch data.
  const [isLoading, setIsLoading] = useState(true);
  // 'error' will store any error messages from our API calls.
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING (SIDE EFFECT) ---
  // useEffect is Mission Control for side effects. It runs code *after* the component renders.
  useEffect(() => {
    // This is "The Mission": a function to fetch the user's links from the server.
    const fetchLinks = async () => {
      // If we don't have a token, we can't fetch anything, so we stop.
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        // This one clean line replaces a whole block of 'fetch' code.
        // The apiClient handles the server URL and the Authorization header automatically.
        const response = await apiClient.get('/api/links');
        
        // Axios puts the JSON response directly in the .data property.
        // We update our component's state with the fetched links.
        setLinks(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
      } finally {
        // This 'finally' block runs whether the 'try' succeeded or 'catch' failed.
        // Either way, we're done loading.
        setIsLoading(false);
      }
    };

    fetchLinks(); // Execute the mission.
  }, [token]); // This is "The Launch Condition": This mission only runs when the 'token' changes.

  // --- EVENT HANDLERS ---

  // This function is passed as a prop to the <CreateLinkForm /> component.
  // It allows the child component to add a new link to our state here in the parent.
  const handleLinkCreated = (newLink: Link) => {
    // We add the new link to the *beginning* of the array for an instant UI update.
    setLinks(prevLinks => [newLink, ...prevLinks]);
  };

  // This function runs when the user clicks a "Delete" button.
  const handleDelete = async (linkId: string) => {
    const originalLinks = links; // Keep a backup of the current links in case of an error.
    
    // --- OPTIMISTIC UI UPDATE ---
    // For a snappy user experience, we remove the link from the UI *immediately*,
    // without waiting for the server to respond.
    setLinks(links.filter(link => link.id !== linkId));

    try {
      // Now, we tell the server to delete the link from the database.
      await apiClient.delete(`/api/links/${linkId}`);
      // If this request succeeds, we don't need to do anything else.
      // Our UI is already correct!
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete link.');
      // If the delete fails on the server, we restore the original links list.
      setLinks(originalLinks);
    }
  };

  // --- CONDITIONAL RENDER ---
  // While data is being fetched, show a simple loading message.
  if (isLoading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  // --- JSX RENDER ---
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

        {/* We render our form component and pass the callback function as a prop */}
        <CreateLinkForm onLinkCreated={handleLinkCreated} />

        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-6">{error}</p>}
        <div className="bg-white shadow rounded-lg">
          <ul className="divide-y divide-gray-200">
            {links.length > 0 ? (
              // We map over the 'links' array to render each one as a list item.
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
              // If there are no links, we show a helpful message.
              <p className="p-4 text-gray-500">You haven't created any links yet. Add one above!</p>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;