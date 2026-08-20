import { useEffect, useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import Spinner from '../ui/Spinner';
import { chatService } from '../../services/chatService';
import { groupService } from '../../services/groupService';
import { useChat } from '../../context/ChatContext';

export default function GroupCreateModal({ onClose }) {
  const { refreshConversations, openConversation } = useChat();
  const [step, setStep] = useState('members'); // 'members' -> 'name'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // array of user objects
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      chatService
        .searchUsers(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const toggleUser = (user) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Give your group a name');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const conversation = await groupService.createGroup({
        groupName: groupName.trim(),
        participantIds: selected.map((u) => u._id),
      });
      await refreshConversations();
      openConversation(conversation);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            {step === 'members' ? 'New group' : 'Name your group'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-black/5" aria-label="Close">
            <X className="h-5 w-5 text-ink/60" />
          </button>
        </div>

        {step === 'members' ? (
          <div className="p-4">
            {selected.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selected.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => toggleUser(u)}
                    className="flex items-center gap-1.5 rounded-full bg-coral-light px-2.5 py-1 text-xs font-medium text-coral-dark"
                  >
                    {u.name} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people to add"
                className="w-full rounded-xl border border-black/10 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-coral"
              />
            </div>

            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto thin-scrollbar">
              {loading && (
                <div className="flex justify-center py-6">
                  <Spinner className="h-5 w-5 text-coral" />
                </div>
              )}
              {results.map((user) => {
                const isSelected = selected.some((u) => u._id === user._id);
                return (
                  <button
                    key={user._id}
                    onClick={() => toggleUser(user)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-black/5"
                  >
                    <Avatar name={user.name} src={user.avatar} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-ink/50">@{user.username}</p>
                    </div>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              className="mt-4 w-full"
              disabled={selected.length === 0}
              onClick={() => setStep('name')}
            >
              Next ({selected.length} selected)
            </Button>
          </div>
        ) : (
          <div className="p-5">
            <TextField
              label="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Weekend Trip"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setStep('members')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? 'Creating…' : 'Create group'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
