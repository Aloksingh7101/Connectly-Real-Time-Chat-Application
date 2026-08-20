import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search conversations' }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none focus:bg-white/15"
      />
    </div>
  );
}
