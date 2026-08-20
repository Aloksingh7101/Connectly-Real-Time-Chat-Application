import { useOutletContext } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import ChatWindow from '../components/chat/ChatWindow';
import EmptyChatState from '../components/chat/EmptyChatState';

export default function Home() {
  const { activeConversation } = useChat();
  const { onBackMobile } = useOutletContext();

  if (!activeConversation) return <EmptyChatState />;

  return <ChatWindow conversation={activeConversation} onBack={onBackMobile} />;
}
