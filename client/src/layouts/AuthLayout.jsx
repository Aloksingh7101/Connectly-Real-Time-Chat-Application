import { Outlet } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel - hidden on mobile */}
      <div className="hidden w-1/2 flex-col justify-between bg-graphite-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <MessageCircle className="h-6 w-6 text-coral" strokeWidth={2.5} />
          Connectly
        </div>
        <div>
          <p className="font-display text-4xl font-semibold leading-tight">
            Conversations,
            <br />
            without the noise.
          </p>
          <p className="mt-4 max-w-sm text-graphite-700/80 text-white/60">
            Real-time messaging built for speed — instant delivery, live presence, and read
            receipts that actually mean something.
          </p>
        </div>
        <p className="text-xs text-white/40">Connectly — a student-built messaging app.</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-canvas px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 font-display text-xl font-semibold text-ink lg:hidden">
            <MessageCircle className="h-6 w-6 text-coral" strokeWidth={2.5} />
            Connectly
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
