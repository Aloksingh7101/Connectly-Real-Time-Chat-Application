import { useState } from 'react';
import { MessageCircle, SquarePen, Users, MessageSquarePlus } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { ChatProvider } from '../context/ChatContext';
import SearchBar from '../components/sidebar/SearchBar';
import ConversationList from '../components/sidebar/ConversationList';
import ProfileMenu from '../components/sidebar/ProfileMenu';
import NewChatModal from '../components/modals/NewChatModal';
import GroupCreateModal from '../components/modals/GroupCreateModal';
import NotificationBell from '../components/sidebar/NotificationBell';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

function NewConversationMenu({ onNewChat, onNewGroup }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label="Start new conversation"
      >
        <SquarePen className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-10 w-44 overflow-hidden rounded-xl bg-graphite-800 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              onNewChat();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white hover:bg-white/5"
          >
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onNewGroup();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white hover:bg-white/5"
          >
            <Users className="h-4 w-4" /> New group
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onSelectMobile }) {
  const { user } = useAuth();
  const { conversations, activeConversation, openConversation, onlineUserIds, unreadCounts } = useChat();
  const [filter, setFilter] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  return (
    <div className="flex h-full w-full flex-col bg-graphite-900">
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <MessageCircle className="h-5 w-5 text-coral" strokeWidth={2.5} />
          Connectly
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <NewConversationMenu onNewChat={() => setShowNewChat(true)} onNewGroup={() => setShowNewGroup(true)} />
        </div>
      </div>

      <div className="px-3 pb-3">
        <SearchBar value={filter} onChange={setFilter} />
      </div>

      <ConversationList
        conversations={conversations}
        currentUserId={user._id}
        activeId={activeConversation?._id}
        filter={filter}
        onlineUserIds={onlineUserIds}
        unreadCounts={unreadCounts}
        onSelect={(c) => {
          openConversation(c);
          onSelectMobile?.();
        }}
      />

      <ProfileMenu />

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showNewGroup && <GroupCreateModal onClose={() => setShowNewGroup(false)} />}
    </div>
  );
}

export default function AppLayout() {
  const [mobileShowChat, setMobileShowChat] = useState(false);

  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar: full-width on mobile until a chat is opened, fixed width on desktop */}
        <div className={`w-full shrink-0 md:block md:w-[340px] ${mobileShowChat ? 'hidden' : 'block'}`}>
          <SidebarContent onSelectMobile={() => setMobileShowChat(true)} />
        </div>

        {/* Chat area: hidden on mobile until a conversation is opened */}
        <div className={`flex-1 md:flex ${mobileShowChat ? 'flex' : 'hidden'}`}>
          <Outlet context={{ onBackMobile: () => setMobileShowChat(false) }} />
        </div>
      </div>
    </ChatProvider>
  );
}
