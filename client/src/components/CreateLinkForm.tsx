import { useState } from 'react';
import apiClient from '../apiClient';

// Define the shape of the data this component will pass back up to its parent.
type Link = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

// Define the shape of the 'props' this component accepts.
// It expects one prop: a function named 'onLinkCreated'.
type CreateLinkFormProps = {
  onLinkCreated: (newLink: Link) => void;
};

const CreateLinkForm = ({ onLinkCreated }: CreateLinkFormProps) => {
  // --- STATE MANAGEMENT ---
  // Local state just for managing the form inputs.
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // --- EVENT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation to ensure inputs aren't empty.
    if (!title || !url) {
      setError('Both title and URL are required.');
      return;
    }

    try {
      // --- THE API CALL ---
      // THE FIX: The path MUST include the "/api" prefix.
      const response = await apiClient.post('/api/links', { title, url });
      
      // Call the function that was passed down from the parent (DashboardPage).
      // This sends the newly created link data back up to the parent.
      onLinkCreated(response.data);

      // Clear the form fields for the next entry.
      setTitle('');
      setUrl('');

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create link.');
    }
  };

  // --- JSX (The Component's UI) ---
  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Link Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button type="submit" className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Add Link
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CreateLinkForm;