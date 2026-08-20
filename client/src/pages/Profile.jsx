import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import api from '../services/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put('/users/profile', form);
      setUser(res.data.data.user);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex items-center gap-4">
        <Avatar name={user.name} src={user.avatar} size={64} />
        <div>
          <p className="font-display text-lg font-semibold text-ink">{user.name}</p>
          <p className="text-sm text-ink/50">@{user.username}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextField
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          maxLength={150}
        />
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && <span className="ml-3 text-sm text-teal">Saved</span>}
      </form>
    </div>
  );
}
