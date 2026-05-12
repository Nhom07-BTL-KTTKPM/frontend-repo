export type ChatMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface SuggestedProduct {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  productUrl?: string;
  reason?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt?: string;
  suggestedProducts?: SuggestedProduct[];
  metadata?: Record<string, unknown>;
}

export interface ChatSessionSummary {
  id: string;
  title?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
}

export interface ChatSessionListResponse {
  items: ChatSessionSummary[];
  nextCursor?: string | null;
}

export interface ChatMessageListResponse {
  items: ChatMessage[];
  nextCursor?: string | null;
}

export interface SendChatRequest {
  customerId: string;
  sessionId?: string;
  message: string;
}

export interface SendChatResponse {
  sessionId: string;
  message: ChatMessage;
  suggestedProducts?: SuggestedProduct[];
}
