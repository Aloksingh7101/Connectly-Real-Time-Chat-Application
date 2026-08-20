import { useState } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border-t border-white/10 p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 hover:bg-white/5"
      >
        <Avatar name={user.name} src={user.avatar} size={36} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-white/40">@{user.username}</p>
        </div>
      </button>

      {open && (
        <div className="absolute bottom-16 left-3 right-3 overflow-hidden rounded-xl bg-graphite-800 shadow-lg">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white hover:bg-white/5"
          >
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white hover:bg-white/5"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-coral hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
