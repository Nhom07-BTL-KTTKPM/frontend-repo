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
    const { customerId, ...rest } = params;
    return axiosClient.get<unknown, ApiResponse<ChatSessionListResponse>>(`/ai/sessions?customerId=${customerId}`, { params: rest });
  },

  listMessages: (sessionId: string, params: { customerId: string; cursor?: string; limit?: number }) => {
    const { customerId, ...rest } = params;
    return axiosClient.get<unknown, ApiResponse<ChatMessageListResponse>>(`/ai/sessions/${sessionId}/messages?customerId=${customerId}`, { 
      params: rest 
    });
  },

  sendMessage: (data: SendChatRequest) => {
    return axiosClient.post<unknown, ApiResponse<SendChatResponse>>('/ai/chat', data);
  },
};
