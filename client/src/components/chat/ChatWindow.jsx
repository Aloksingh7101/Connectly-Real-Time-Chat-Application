import { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Spinner from '../ui/Spinner';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const socket = useSocket();
  const { onlineUserIds } = useChat();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(() => new Set());
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load history over REST once when the conversation changes.
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    chatService
      .getMessages(conversation._id)
      .then((data) => setMessages(data.messages))
      .finally(() => setLoading(false));
  }, [conversation._id]);

  // Join/leave the conversation's Socket.IO room as it changes/unmounts —
  // this is what makes 'receive_message' actually reach this component.
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_conversation', conversation._id);
    return () => socket.emit('leave_conversation', conversation._id);
  }, [socket, conversation._id]);

  // Core real-time listeners: new messages, typing, delivered/read receipts.
  useEffect(() => {
    if (!socket) return;

    const handleReceive = ({ message }) => {
      if (message.conversation !== conversation._id) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev; // avoid dupes from own optimistic send
        return [...prev, message];
      });
      // If this message isn't ours, immediately ack delivery — the chat
      // is open, so it has genuinely "arrived" the instant it's rendered.
      if (message.sender._id !== user._id) {
        socket.emit('message_delivered', { messageId: message._id, conversationId: conversation._id });
        socket.emit('message_read', { messageId: message._id, conversationId: conversation._id });
      }
    };

    const handleTypingStart = ({ conversationId, userId }) => {
      if (conversationId !== conversation._id || userId === user._id) return;
      setTypingUsers((prev) => new Set(prev).add(userId));
    };

    const handleTypingStop = ({ conversationId, userId }) => {
      if (conversationId !== conversation._id) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleDelivered = ({ messageId, userId: byUserId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deliveredTo: [...new Set([...(m.deliveredTo || []), byUserId])] } : m
        )
      );
    };

    const handleRead = ({ messageId, userId: byUserId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, readBy: [...new Set([...(m.readBy || []), byUserId])] } : m
        )
      );
    };

    socket.on('receive_message', handleReceive);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_delivered', handleDelivered);
    socket.on('message_read', handleRead);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_delivered', handleDelivered);
      socket.off('message_read', handleRead);
    };
  }, [socket, conversation._id, user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = (text, attachments = []) => {
    if (!socket) return;
    const tempId = `temp-${Date.now()}`;
    const messageType = attachments[0]?.type || 'text';
    const optimisticMessage = {
      _id: tempId,
      text,
      attachments,
      messageType,
      conversation: conversation._id,
      sender: user,
      createdAt: new Date().toISOString(),
      deliveredTo: [],
      readBy: [],
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    socket.emit(
      'send_message',
      { conversationId: conversation._id, text, attachments, messageType },
      (res) => {
        if (res.success) {
          setMessages((prev) => prev.map((m) => (m._id === tempId ? res.message : m)));
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
        }
      }
    );
    socket.emit('typing_stop', { conversationId: conversation._id });
  };

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing_start', { conversationId: conversation._id });
    clearTimeout(typingTimeoutRef.current);
    // Auto-stop after a pause in typing, so we're not relying on the user
    // to always trigger a stop event (e.g. if they just walk away).
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: conversation._id });
    }, 2000);
  };

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader
        conversation={conversation}
        currentUserId={user._id}
        onBack={onBack}
        isOnline={
          !conversation.isGroup &&
          onlineUserIds?.has(conversation.participants.find((p) => p._id !== user._id)?._id)
        }
      />

      <div className="thin-scrollbar flex-1 space-y-2 overflow-y-auto bg-canvas px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-5 w-5 text-coral" />
          </div>
        ) : messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink/40">
            No messages yet — send the first one.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m._id}
              message={m}
              isOwn={(m.sender._id || m.sender) === user._id}
              currentUserId={user._id}
            />
          ))
        )}
        {typingUsers.size > 0 && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
