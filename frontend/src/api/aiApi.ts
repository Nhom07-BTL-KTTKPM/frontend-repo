import { axiosClient } from './axiosClient';
import type { ApiResponse } from '../types/api';
import type {
  ChatSessionListResponse,
  ChatMessageListResponse,
  SendChatRequest,
  SendChatResponse,
} from '../types/ai';

export const aiApi = {
  listSessions: (params: { customerId: string; cursor?: string; limit?: number }) => {
    return axiosClient.get<unknown, ApiResponse<ChatSessionListResponse>>('/ai/sessions', { params });
  },

  listMessages: (sessionId: string, params: { cursor?: string; limit?: number }) => {
    return axiosClient.get<unknown, ApiResponse<ChatMessageListResponse>>(`/ai/sessions/${sessionId}/messages`, { params });
  },

  sendMessage: (data: SendChatRequest) => {
    return axiosClient.post<unknown, ApiResponse<SendChatResponse>>('/ai/chat', data);
  },
};
