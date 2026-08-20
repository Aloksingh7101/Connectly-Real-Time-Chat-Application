import { ArrowLeft, MoreVertical } from 'lucide-react';
import Avatar from '../ui/Avatar';

export default function ChatHeader({ conversation, currentUserId, onBack, isOnline }) {
  const other = conversation.isGroup
    ? null
    : conversation.participants.find((p) => p._id !== currentUserId);

  const online = isOnline ?? other?.isOnline;
  const title = conversation.isGroup ? conversation.groupName : other?.name;
  const subtitle = conversation.isGroup
    ? `${conversation.participants.length} members`
    : online
    ? 'Online'
    : other?.lastSeen
    ? `Last seen ${new Date(other.lastSeen).toLocaleString()}`
    : '';

  return (
    <div className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
      <button onClick={onBack} className="rounded-full p-1.5 hover:bg-black/5 md:hidden" aria-label="Back">
        <ArrowLeft className="h-5 w-5 text-ink/70" />
      </button>
      <Avatar
        name={title}
        src={conversation.isGroup ? conversation.groupAvatar : other?.avatar}
        size={40}
        online={!conversation.isGroup && online}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        <p className="truncate text-xs text-ink/50">{subtitle}</p>
      </div>
      <button className="rounded-full p-1.5 hover:bg-black/5" aria-label="Conversation options">
        <MoreVertical className="h-5 w-5 text-ink/60" />
      </button>
    </div>
  );
}
