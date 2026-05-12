import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import { useChatStore } from '../store/chatStore';
import type { ChatMessageListResponse, ChatSessionListResponse, SendChatRequest, SendChatResponse } from '../types/ai';

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message);
  }
  return 'Unexpected error. Please try again.';
};

export const useChat = () => {
  const queryClient = useQueryClient();
  const {
    setSessionsLoading,
    setSessionsError,
    setSessions,
    appendSessions,
    upsertSession,
    setMessagesLoading,
    setMessagesError,
    setMessages,
    appendMessages,
    prependMessages,
    createOptimisticSession,
    migrateSessionId,
    appendOptimisticMessage,
    replaceMessage,
    removeMessage,
  } = useChatStore();

  const useSessionsQuery = (params: {
    customerId: string;
    cursor?: string;
    limit?: number;
    enabled?: boolean;
    append?: boolean;
  }) => {
    const { customerId, cursor, limit = 20, enabled = true, append = false } = params;

    return useQuery({
      queryKey: ['ai', 'sessions', customerId, cursor, limit],
      queryFn: async (): Promise<ChatSessionListResponse> => {
        setSessionsLoading(true);
        setSessionsError(null);
        const res = await aiApi.listSessions({ customerId, cursor, limit });
        return res.data;
      },
      enabled: !!customerId && enabled,
      onSuccess: (data) => {
        if (append) {
          appendSessions(data.items, data.nextCursor ?? null);
        } else {
          setSessions(data.items, data.nextCursor ?? null);
        }
      },
      onError: (error) => {
        setSessionsError(getErrorMessage(error));
      },
      onSettled: () => {
        setSessionsLoading(false);
      },
    });
  };

  const useMessagesQuery = (params: {
    sessionId: string;
    cursor?: string;
    limit?: number;
    enabled?: boolean;
    mode?: 'append' | 'prepend';
  }) => {
    const { sessionId, cursor, limit = 30, enabled = true, mode = 'append' } = params;

    return useQuery({
      queryKey: ['ai', 'messages', sessionId, cursor, limit],
      queryFn: async (): Promise<ChatMessageListResponse> => {
        setMessagesLoading(sessionId, true);
        setMessagesError(sessionId, null);
        const res = await aiApi.listMessages(sessionId, { cursor, limit });
        return res.data;
      },
      enabled: !!sessionId && enabled,
      onSuccess: (data) => {
        if (mode === 'prepend') {
          prependMessages(sessionId, data.items, data.nextCursor ?? null);
        } else if (cursor) {
          appendMessages(sessionId, data.items, data.nextCursor ?? null);
        } else {
          setMessages(sessionId, data.items, data.nextCursor ?? null);
        }
      },
      onError: (error) => {
        setMessagesError(sessionId, getErrorMessage(error));
      },
      onSettled: () => {
        setMessagesLoading(sessionId, false);
      },
    });
  };

  const sendMessageMutation = useMutation({
    mutationFn: (data: SendChatRequest) => aiApi.sendMessage(data),
    onMutate: async (variables) => {
      let sessionId = variables.sessionId ?? useChatStore.getState().currentSessionId;
      let tempSessionId: string | null = null;

      if (!sessionId) {
        tempSessionId = createOptimisticSession(variables.message.slice(0, 48));
        sessionId = tempSessionId;
      }

      const tempMessageId = appendOptimisticMessage(sessionId, variables.message);
      return { sessionId, tempMessageId, tempSessionId };
    },
    onSuccess: (res, variables, context) => {
      const payload: SendChatResponse = res.data;
      const sessionId = payload.sessionId;
      const activeSessionId = context?.tempSessionId && context.tempSessionId !== sessionId
        ? context.tempSessionId
        : context?.sessionId;

      if (context?.tempSessionId && context.tempSessionId !== sessionId) {
        migrateSessionId(context.tempSessionId, sessionId);
      }

      if (activeSessionId && context?.tempMessageId) {
        if (payload.message.role === 'USER') {
          replaceMessage(activeSessionId, context.tempMessageId, payload.message);
        } else {
          appendMessages(activeSessionId, [payload.message]);
        }
      } else {
        appendMessages(sessionId, [payload.message]);
      }

      upsertSession({
        id: sessionId,
        title: payload.message.content.slice(0, 64),
        lastMessage: payload.message.content,
        lastMessageAt: payload.message.createdAt,
      });

      useChatStore.getState().setCurrentSessionId(sessionId);
      queryClient.invalidateQueries({ queryKey: ['ai', 'sessions'] });
    },
    onError: (error, variables, context) => {
      if (context?.sessionId && context.tempMessageId) {
        removeMessage(context.sessionId, context.tempMessageId);
      }
      if (context?.tempSessionId) {
        useChatStore.getState().setCurrentSessionId(null);
      }
      setSessionsError(getErrorMessage(error));
    },
  });

  return {
    useSessionsQuery,
    useMessagesQuery,
    sendMessageMutation,
  };
};
