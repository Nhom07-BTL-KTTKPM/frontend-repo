import { create } from 'zustand';
import type { ChatMessage, ChatSessionSummary } from '../types/ai';

interface ChatStoreState {
  currentSessionId: string | null;
  sessions: ChatSessionSummary[];
  sessionsNextCursor: string | null;
  sessionsLoading: boolean;
  sessionsError: string | null;

  messagesBySession: Record<string, ChatMessage[]>;
  messagesNextCursorBySession: Record<string, string | null>;
  messagesLoadingBySession: Record<string, boolean>;
  messagesErrorBySession: Record<string, string | null>;

  setCurrentSessionId: (sessionId: string | null) => void;
  setSessionsLoading: (loading: boolean) => void;
  setSessionsError: (error: string | null) => void;
  setSessions: (sessions: ChatSessionSummary[], nextCursor?: string | null) => void;
  appendSessions: (sessions: ChatSessionSummary[], nextCursor?: string | null) => void;
  upsertSession: (session: ChatSessionSummary) => void;

  setMessagesLoading: (sessionId: string, loading: boolean) => void;
  setMessagesError: (sessionId: string, error: string | null) => void;
  setMessages: (sessionId: string, messages: ChatMessage[], nextCursor?: string | null) => void;
  appendMessages: (sessionId: string, messages: ChatMessage[], nextCursor?: string | null) => void;
  prependMessages: (sessionId: string, messages: ChatMessage[], nextCursor?: string | null) => void;

  appendOptimisticMessage: (sessionId: string, content: string) => string;
  replaceMessage: (sessionId: string, tempId: string, message: ChatMessage) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  resetChatState: () => void;
}

const normalizeSessionList = (sessions: ChatSessionSummary[]) => {
  const byId = new Map<string, ChatSessionSummary>();
  sessions.forEach((session) => {
    byId.set(session.id, session);
  });
  return Array.from(byId.values());
};

const mergeMessages = (existing: ChatMessage[], incoming: ChatMessage[]) => {
  const byId = new Map<string, ChatMessage>();
  existing.forEach((message) => byId.set(message.id, message));
  incoming.forEach((message) => byId.set(message.id, message));
  return Array.from(byId.values());
};

export const useChatStore = create<ChatStoreState>((set, get) => ({
  currentSessionId: null,
  sessions: [],
  sessionsNextCursor: null,
  sessionsLoading: false,
  sessionsError: null,

  messagesBySession: {},
  messagesNextCursorBySession: {},
  messagesLoadingBySession: {},
  messagesErrorBySession: {},

  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),

  setSessionsLoading: (loading) => set({ sessionsLoading: loading }),
  setSessionsError: (error) => set({ sessionsError: error }),

  setSessions: (sessions, nextCursor = null) => set({
    sessions: normalizeSessionList(sessions),
    sessionsNextCursor: nextCursor ?? null,
  }),

  appendSessions: (sessions, nextCursor = null) => set((state) => ({
    sessions: normalizeSessionList([...state.sessions, ...sessions]),
    sessionsNextCursor: nextCursor ?? state.sessionsNextCursor ?? null,
  })),

  upsertSession: (session) => set((state) => {
    const sessions = normalizeSessionList([session, ...state.sessions]);
    return { sessions };
  }),

  setMessagesLoading: (sessionId, loading) => set((state) => ({
    messagesLoadingBySession: {
      ...state.messagesLoadingBySession,
      [sessionId]: loading,
    },
  })),

  setMessagesError: (sessionId, error) => set((state) => ({
    messagesErrorBySession: {
      ...state.messagesErrorBySession,
      [sessionId]: error,
    },
  })),

  setMessages: (sessionId, messages, nextCursor = null) => set((state) => ({
    messagesBySession: {
      ...state.messagesBySession,
      [sessionId]: messages,
    },
    messagesNextCursorBySession: {
      ...state.messagesNextCursorBySession,
      [sessionId]: nextCursor ?? null,
    },
  })),

  appendMessages: (sessionId, messages, nextCursor = null) => set((state) => {
    const existing = state.messagesBySession[sessionId] ?? [];
    return {
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: mergeMessages(existing, messages),
      },
      messagesNextCursorBySession: {
        ...state.messagesNextCursorBySession,
        [sessionId]: nextCursor ?? state.messagesNextCursorBySession[sessionId] ?? null,
      },
    };
  }),

  prependMessages: (sessionId, messages, nextCursor = null) => set((state) => {
    const existing = state.messagesBySession[sessionId] ?? [];
    return {
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: mergeMessages(messages, existing),
      },
      messagesNextCursorBySession: {
        ...state.messagesNextCursorBySession,
        [sessionId]: nextCursor ?? state.messagesNextCursorBySession[sessionId] ?? null,
      },
    };
  }),

  appendOptimisticMessage: (sessionId, content) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sessionId,
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: [...(state.messagesBySession[sessionId] ?? []), optimisticMessage],
      },
    }));

    return tempId;
  },

  replaceMessage: (sessionId, tempId, message) => set((state) => {
    const messages = (state.messagesBySession[sessionId] ?? []).map((item) => {
      if (item.id === tempId) {
        return message;
      }
      return item;
    });

    return {
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: messages,
      },
    };
  }),

  removeMessage: (sessionId, messageId) => set((state) => ({
    messagesBySession: {
      ...state.messagesBySession,
      [sessionId]: (state.messagesBySession[sessionId] ?? []).filter((item) => item.id !== messageId),
    },
  })),

  resetChatState: () => set({
    currentSessionId: null,
    sessions: [],
    sessionsNextCursor: null,
    sessionsLoading: false,
    sessionsError: null,
    messagesBySession: {},
    messagesNextCursorBySession: {},
    messagesLoadingBySession: {},
    messagesErrorBySession: {},
  }),
}));
