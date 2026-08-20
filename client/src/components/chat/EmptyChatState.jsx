import { MessageCircle } from 'lucide-react';

export default function EmptyChatState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-coral-light">
        <MessageCircle className="h-7 w-7 text-coral" />
      </div>
      <p className="font-display text-lg font-semibold text-ink">Your messages</p>
      <p className="max-w-xs text-sm text-ink/50">
        Select a conversation from the sidebar, or start a new one to say hello.
      </p>
    </div>
  );
}
