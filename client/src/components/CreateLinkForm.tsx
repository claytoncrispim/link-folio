import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Define the shape of a Link object for TypeScript
type Link = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

// Define the props our component will accept, including the callback function
interface CreateLinkFormProps {
  onLinkCreated: (newLink: Link) => void;
}

const CreateLinkForm: React.FC<CreateLinkFormProps> = ({ onLinkCreated }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('You must be logged in to create a link.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, url }),
      });

      const newLink: Link = await response.json();

      if (!response.ok) {
        throw new Error((newLink as any).error || 'Failed to create link');
      }

      // On success, call the parent's function with the new link data
      onLinkCreated(newLink);

      // Clear the form for the next entry
      setTitle('');
      setUrl('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="mb-8 p-6 bg-white shadow rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Create a New Link</h2>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., My Portfolio"
          />
        </div>
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://example.com"
          />
        </div>
        <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Add Link
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
};

export default CreateLinkForm;
