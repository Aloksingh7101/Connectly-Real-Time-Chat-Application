import { Check, CheckCheck, FileText, Download } from 'lucide-react';

function StatusIcon({ message, currentUserId }) {
  const others = message.readBy?.filter((id) => id !== currentUserId) || [];
  const delivered = message.deliveredTo?.filter((id) => id !== currentUserId) || [];

  if (others.length > 0) return <CheckCheck className="h-3.5 w-3.5 text-coral" />;
  if (delivered.length > 0) return <CheckCheck className="h-3.5 w-3.5 text-white/50" />;
  return <Check className="h-3.5 w-3.5 text-white/50" />;
}

function Attachment({ attachment }) {
  if (attachment.type === 'image') {
    return (
      <img
        src={attachment.url}
        alt={attachment.name || 'attachment'}
        className="mb-1.5 max-h-64 w-full rounded-lg object-cover"
      />
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="mb-1.5 flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{attachment.name || 'File'}</span>
      <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
    </a>
  );
}

export default function MessageBubble({ message, isOwn, currentUserId }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
          isOwn
            ? 'rounded-br-sm bg-graphite-900 text-white'
            : 'rounded-bl-sm bg-white text-ink shadow-sm'
        }`}
      >
        {message.replyTo && (
          <div
            className={`mb-1.5 truncate border-l-2 pl-2 text-xs ${
              isOwn ? 'border-coral text-white/60' : 'border-coral text-ink/50'
            }`}
          >
            {message.replyTo.text}
          </div>
        )}
        {message.attachments?.map((a, i) => (
          <Attachment key={a.publicId || i} attachment={a} />
        ))}
        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? 'text-white/50' : 'text-ink/40'
          }`}
        >
          {message.edited && <span>edited</span>}
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && <StatusIcon message={message} currentUserId={currentUserId} />}
        </div>
      </div>
    </div>
  );
}
