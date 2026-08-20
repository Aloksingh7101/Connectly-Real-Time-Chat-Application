export default function TextField({ label, error, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>}
      <input
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
          error ? 'border-red-400 focus:border-red-500' : 'border-black/10 focus:border-coral'
        } ${className}`}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
