import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/ai';
import { ChatMessage as ChatMessageItem } from './ChatMessage';

interface ChatThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const ChatThread = ({ messages, isLoading, error, hasMore, onLoadMore }: ChatThreadProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages.length]);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#a68b5b]">Advisor</p>
          <h2 className="text-2xl font-semibold text-[#1a1a1a]">Chat Thread</h2>
        </div>
        <button
          type="button"
          onClick={onLoadMore}
          disabled={!hasMore || isLoading}
          className="rounded-full border border-[#c9a96e]/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5438] transition hover:border-[#c9a96e] hover:text-[#1a1a1a] disabled:opacity-40"
        >
          Load earlier
        </button>
      </div>

      <div ref={containerRef} className="mt-6 flex-1 space-y-4 overflow-y-auto pr-2">
        {messages.map((message) => (
          <ChatMessageItem key={message.id} message={message} />
        ))}

        {!messages.length && !isLoading && (
          <div className="rounded-2xl border border-dashed border-[#c9a96e]/50 bg-[#faf6f0] p-6 text-center text-sm text-[#6b5438]">
            Start the conversation with your beauty goals and we will handle the rest.
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200/50 bg-rose-50 p-3 text-xs text-rose-600">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 text-xs uppercase tracking-[0.3em] text-[#888]">
          Loading messages...
        </div>
      )}
    </section>
  );
};
