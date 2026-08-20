import { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import { chatService } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';

export default function NewChatModal({ onClose }) {
  const { startConversationWithUser } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    // Debounce the search so we're not firing a request on every keystroke.
    const timeout = setTimeout(() => {
      chatService
        .searchUsers(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = async (user) => {
    setStarting(user._id);
    try {
      await startConversationWithUser(user._id);
      onClose();
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">New conversation</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-black/5" aria-label="Close">
            <X className="h-5 w-5 text-ink/60" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username"
              className="w-full rounded-xl border border-black/10 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-coral"
            />
          </div>

          <div className="mt-3 max-h-72 space-y-1 overflow-y-auto thin-scrollbar">
            {loading && (
              <div className="flex justify-center py-6">
                <Spinner className="h-5 w-5 text-coral" />
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <p className="py-6 text-center text-sm text-ink/50">No users found.</p>
            )}

            {results.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelect(user)}
                disabled={starting === user._id}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-black/5 disabled:opacity-50"
              >
                <Avatar name={user.name} src={user.avatar} size={38} online={user.isOnline} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink/50">@{user.username}</p>
                </div>
                {starting === user._id && <Spinner className="h-4 w-4 text-coral" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
