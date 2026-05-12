import type { ChatMessage } from '../../types/ai';

interface ChatMessageProps {
  message: ChatMessage;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'bg-gradient-to-r from-[#c9a96e] to-[#a68b5b] text-white'
            : 'bg-white text-[#2d2d2d] shadow-[0_12px_30px_-22px_rgba(0,0,0,0.4)]'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${isUser ? 'text-white/70' : 'text-[#888]'}`}>
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
        </p>
      </div>
    </div>
  );
};
