import Avatar from '../ui/Avatar';

function timeAgo(date) {
  if (!date) return '';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ConversationItem({ conversation, currentUserId, active, onClick, isOnline, unreadCount }) {
  const other = conversation.isGroup
    ? null
    : conversation.participants.find((p) => p._id !== currentUserId);

  const title = conversation.isGroup ? conversation.groupName : other?.name;
  const avatarSrc = conversation.isGroup ? conversation.groupAvatar : other?.avatar;
  const preview = conversation.lastMessage?.text || 'Say hello 👋';

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-white/15' : 'hover:bg-white/5'
      }`}
    >
      <Avatar name={title} src={avatarSrc} size={44} online={!conversation.isGroup && isOnline} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-white">{title}</span>
          <span className="shrink-0 text-xs text-white/40">
            {timeAgo(conversation.lastMessage?.timestamp)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-white/50">{preview}</p>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
