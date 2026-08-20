import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { chatService } from '../services/chatService';
import { useSocket } from './SocketContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const [unreadCounts, setUnreadCounts] = useState({}); // conversationId -> count

  const refreshConversations = useCallback(async () => {
    const data = await chatService.getConversations();
    setConversations(data);
    return data;
  }, []);

  useEffect(() => {
    refreshConversations().finally(() => setLoading(false));
  }, [refreshConversations]);

  // Live presence + "someone sent me a message somewhere" notifications.
  // Scoped to the personal `user:<id>` room the server auto-joins every
  // socket to, so this fires regardless of which conversation is open.
  useEffect(() => {
    if (!socket) return;

    const handleOnline = ({ userId }) =>
      setOnlineUserIds((prev) => new Set(prev).add(userId));

    const handleOffline = ({ userId }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

    const handleNotification = ({ notification }) => {
      // Resync the sidebar (new lastMessage, reordering) rather than
      // hand-rolling the merge logic — conversations don't update often
      // enough for this extra fetch to matter.
      refreshConversations();
      setUnreadCounts((prev) => {
        const convId = notification.conversation;
        if (activeConversation?._id === convId) return prev; // already viewing it
        return { ...prev, [convId]: (prev[convId] || 0) + 1 };
      });
    };

    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);
    socket.on('new_notification', handleNotification);

    return () => {
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
      socket.off('new_notification', handleNotification);
    };
  }, [socket, refreshConversations, activeConversation]);

  const openConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setUnreadCounts((prev) => ({ ...prev, [conversation._id]: 0 }));
  }, []);

  const startConversationWithUser = useCallback(
    async (userId) => {
      const conversation = await chatService.createConversation(userId);
      await refreshConversations();
      setActiveConversation(conversation);
      return conversation;
    },
    [refreshConversations]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        loading,
        activeConversation,
        onlineUserIds,
        unreadCounts,
        openConversation,
        startConversationWithUser,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}

