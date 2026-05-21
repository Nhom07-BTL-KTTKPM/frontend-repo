import { useEffect, useMemo, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useChat } from '../../hooks/useChat';
import { ChatComposer } from './ChatComposer';
import { ChatThread } from './ChatThread';
import { SuggestedProducts } from './SuggestedProducts';

interface ChatExperienceProps {
  variant?: 'page' | 'widget';
  showSuggested?: boolean;
  showHeader?: boolean;
}

export const ChatExperience = ({
  variant = 'page',
  showSuggested = true,
  showHeader = true,
}: ChatExperienceProps) => {
  const user = useAuthStore((state) => state.user);
  const customerId = user?.accountId ?? '';

  const {
    messages,
    messagesLoading,
    messagesError,
  } = useChatStore();

  const { sendMessageMutation } = useChat();

  const activeMessages = messages.filter(Boolean);

  const suggestedProducts = useMemo(() => {
    for (let index = activeMessages.length - 1; index >= 0; index -= 1) {
      const message = activeMessages[index];
      if (message.role === 'ASSISTANT') {
        return message.suggestedProducts ?? [];
      }
    }
    return [];
  }, [activeMessages]);


  const lastSentMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (messagesError) {
      toast.error(messagesError, {
        action: {
          label: 'Thử lại',
          onClick: () => {
            if (!customerId || !lastSentMessageRef.current) {
              return;
            }
            sendMessageMutation.mutate({
              customerId,
              message: lastSentMessageRef.current,
            });
          },
        },
      });
    }
  }, [messagesError, customerId, sendMessageMutation]);

  useEffect(() => {
    if (sendMessageMutation.error) {
      toast.error('Gửi tin nhắn thất bại.', {
        action: {
          label: 'Thử lại',
          onClick: () => {
            if (!customerId || !lastSentMessageRef.current) {
              return;
            }
            sendMessageMutation.mutate({
              customerId,
              message: lastSentMessageRef.current,
            });
          },
        },
      });
    }
  }, [sendMessageMutation.error, customerId, sendMessageMutation]);

  const handleSend = (message: string) => {
    if (!customerId) {
      return;
    }

    lastSentMessageRef.current = message;

    sendMessageMutation.mutate({
      customerId,
      message,
    });
  };

  const isWidget = variant === 'widget';
  const gridClassName = showSuggested
    ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]'
    : 'grid gap-6';

  return (
    <div className="relative flex h-full flex-col gap-4">
      {showHeader && (
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#a68b5b]">Lumiere Lab</p>
          <h1 className="text-3xl font-semibold text-[#1a1a1a]">
            Trợ lý làm đẹp AI
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#555]">
            Tư vấn theo nhu cầu, gợi ý routine và sản phẩm dành riêng cho bạn.
          </p>
        </div>
      )}

      <div className={`${gridClassName} min-h-0 flex-1`}>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-2xl border border-[#c9a96e]/40 bg-gradient-to-r from-[#faf6f0] via-white to-[#faf6f0] px-4 py-3 text-xs text-[#6b5438]">
            Lumiere AI gợi ý routine và sản phẩm phù hợp. Hãy test trước khi dùng và tham khảo chuyên gia nếu có vấn đề y khoa.
          </div>
          <ChatThread
            messages={activeMessages}
            isLoading={messagesLoading}
            error={messagesError}
            autoScroll
          />
          <div className="rounded-2xl border border-[#f0e8dc] bg-white/70 px-4 py-2 text-[11px] text-[#888]">
            Nội dung tư vấn mang tính tham khảo, không thay thế tư vấn chuyên môn.
          </div>
          <ChatComposer
            onSend={handleSend}
            disabled={!customerId}
            isSending={sendMessageMutation.isPending}
          />
        </div>

        {showSuggested && (
          <div className="min-h-0 h-full">
            <SuggestedProducts products={suggestedProducts} />
          </div>
        )}
      </div>

      {sendMessageMutation.isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#e8d5a8] bg-white/90 px-6 py-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-[#e8d5a8]">
              <MessageCircle className="animate-pulse" size={24} />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b5438]">Dang ket noi...</p>
          </div>
        </div>
      )}
    </div>
  );
};
