import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useChat } from '../hooks/useChat';
import { ChatComposer, ChatSidebar, ChatThread, SuggestedProducts } from '../components/chat';

export const Chat = () => {
  const user = useAuthStore((state) => state.user);
  const customerId = user?.accountId ?? '';

  const {
    currentSessionId,
    sessions,
    sessionsNextCursor,
    sessionsLoading,
    sessionsError,
    messagesBySession,
    messagesNextCursorBySession,
    messagesLoadingBySession,
    messagesErrorBySession,
    setCurrentSessionId,
  } = useChatStore();

  const { useSessionsQuery, useMessagesQuery, sendMessageMutation } = useChat();

  const [sessionsCursor, setSessionsCursor] = useState<string | undefined>(undefined);
  const [appendSessionsMode, setAppendSessionsMode] = useState(false);

  const sessionsQuery = useSessionsQuery({
    customerId,
    cursor: sessionsCursor,
    limit: 20,
    enabled: !!customerId,
    append: appendSessionsMode,
  });

  useEffect(() => {
    if (!customerId) {
      return;
    }
    setSessionsCursor(undefined);
    setAppendSessionsMode(false);
  }, [customerId]);

  useEffect(() => {
    if (appendSessionsMode && sessionsQuery.isSuccess) {
      setAppendSessionsMode(false);
    }
  }, [appendSessionsMode, sessionsQuery.isSuccess]);

  const [messageCursor, setMessageCursor] = useState<string | undefined>(undefined);
  const [messageMode, setMessageMode] = useState<'append' | 'prepend'>('append');

  useEffect(() => {
    setMessageCursor(undefined);
    setMessageMode('append');
  }, [currentSessionId]);

  const messagesQuery = useMessagesQuery({
    sessionId: currentSessionId ?? '',
    cursor: messageCursor,
    limit: 30,
    enabled: !!currentSessionId,
    mode: messageMode,
  });

  useEffect(() => {
    if (messageMode === 'prepend' && messagesQuery.isSuccess) {
      setMessageMode('append');
    }
  }, [messageMode, messagesQuery.isSuccess]);

  const activeMessages = currentSessionId ? messagesBySession[currentSessionId] ?? [] : [];
  const messagesLoading = currentSessionId ? messagesLoadingBySession[currentSessionId] ?? false : false;
  const messagesError = currentSessionId ? messagesErrorBySession[currentSessionId] ?? null : null;
  const messagesNextCursor = currentSessionId ? messagesNextCursorBySession[currentSessionId] ?? null : null;

  const suggestedProducts = useMemo(() => {
    for (let index = activeMessages.length - 1; index >= 0; index -= 1) {
      const products = activeMessages[index].suggestedProducts;
      if (products && products.length) {
        return products;
      }
    }
    return [];
  }, [activeMessages]);

  const handleSend = (message: string) => {
    if (!customerId) {
      return;
    }

    sendMessageMutation.mutate({
      customerId,
      sessionId: currentSessionId ?? undefined,
      message,
    });
  };

  const handleLoadMoreSessions = () => {
    if (!sessionsNextCursor || sessionsLoading) {
      return;
    }
    setSessionsCursor(sessionsNextCursor);
    setAppendSessionsMode(true);
  };

  const handleLoadMoreMessages = () => {
    if (!currentSessionId || !messagesNextCursor || messagesLoading) {
      return;
    }
    setMessageCursor(messagesNextCursor);
    setMessageMode('prepend');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top,_rgba(201,169,110,0.25),_transparent_55%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#a68b5b]">Lumiere Lab</p>
            <h1 className="text-3xl font-semibold text-[#1a1a1a]">
              AI Beauty Advisor
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#555]">
              Crafted guidance, tailored routines, and personalized product stories in one space.
            </p>
          </div>
          <div className="rounded-full border border-[#e8d5a8] bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#6b5438]">
            Premium Advisory
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={currentSessionId}
            isLoading={sessionsLoading}
            error={sessionsError}
            hasMore={!!sessionsNextCursor}
            onSelectSession={setCurrentSessionId}
            onLoadMore={handleLoadMoreSessions}
          />

          <div className="flex h-full flex-col gap-6">
            <ChatThread
              messages={activeMessages}
              isLoading={messagesLoading}
              error={messagesError}
              hasMore={!!messagesNextCursor}
              onLoadMore={handleLoadMoreMessages}
            />
            <ChatComposer
              onSend={handleSend}
              disabled={!customerId}
              isSending={sendMessageMutation.isPending}
            />
            <div className="rounded-2xl border border-[#f0e8dc] bg-white/70 px-4 py-3 text-xs text-[#888]">
              Advisory content is generated for inspiration and does not replace professional care.
            </div>
          </div>

          <SuggestedProducts products={suggestedProducts} />
        </div>
      </div>
    </div>
  );
};
