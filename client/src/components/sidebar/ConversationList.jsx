import { MessageSquareOff } from 'lucide-react';
import ConversationItem from './ConversationItem';

export default function ConversationList({
  conversations,
  currentUserId,
  activeId,
  onSelect,
  filter,
  onlineUserIds,
  unreadCounts,
}) {
  const filtered = conversations.filter((c) => {
    if (!filter) return true;
    const title = c.isGroup ? c.groupName : c.participants.find((p) => p._id !== currentUserId)?.name;
    return title?.toLowerCase().includes(filter.toLowerCase());
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <MessageSquareOff className="mb-3 h-8 w-8 text-white/20" />
        <p className="text-sm text-white/50">
          {filter ? 'No conversations match your search.' : 'No conversations yet — search for someone to start chatting.'}
        </p>
      </div>
    );
  }

  return (
    <div className="thin-scrollbar flex-1 space-y-1 overflow-y-auto px-2 pb-2">
      {filtered.map((c) => {
        const other = c.isGroup ? null : c.participants.find((p) => p._id !== currentUserId);
        return (
          <ConversationItem
            key={c._id}
            conversation={c}
            currentUserId={currentUserId}
            active={c._id === activeId}
            onClick={() => onSelect(c)}
            isOnline={other ? onlineUserIds?.has(other._id) || other.isOnline : false}
            unreadCount={unreadCounts?.[c._id] || 0}
          />
        );
      })}
    </div>
  );
}
