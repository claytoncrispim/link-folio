import { useState } from 'react';
import apiClient, { useApiRequestStatus } from '../apiClient';
import RequestStatusNotice from './RequestStatusNotice';

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
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestStatus = useApiRequestStatus();

  const buttonLabel = !isSubmitting
    ? 'Add Link'
    : requestStatus.phase === 'warming'
      ? 'Waking server...'
      : requestStatus.phase === 'retrying'
        ? 'Retrying...'
        : 'Saving...';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation to ensure inputs aren't empty.
    if (!title || !url) {
      setError('Both title and URL are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/api/links', { title, url });

      onLinkCreated(response.data);
      setTitle('');
      setUrl('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-lg border border-gray-700 bg-gray-900 p-6 shadow">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Link Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="flex-grow rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isSubmitting}
          className="flex-grow rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          {buttonLabel}
        </button>
      </form>
      {isSubmitting && <RequestStatusNotice status={requestStatus} className="mt-4" compact />}
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
};

export default CreateLinkForm;