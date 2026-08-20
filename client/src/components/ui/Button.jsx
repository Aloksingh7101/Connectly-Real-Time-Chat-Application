export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-coral text-white hover:bg-coral-dark',
    secondary: 'bg-graphite-800 text-white hover:bg-graphite-700',
    ghost: 'bg-transparent text-ink hover:bg-black/5',
    danger: 'bg-transparent text-red-600 hover:bg-red-50',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
