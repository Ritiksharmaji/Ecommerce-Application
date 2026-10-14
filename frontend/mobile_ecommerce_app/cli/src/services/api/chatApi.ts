import type {ChatActionResult, ChatResponse} from '@/types/chat';
import {apiClient} from './client';

export interface ChatRequest {
  sessionId?: string;
  message?: string;
  actionResults?: ChatActionResult[];
}

export const chatApi = {
  /** POST /api/chat - one assistant turn (the assistant may take ~5-20 s). */
  async send(body: ChatRequest): Promise<ChatResponse> {
    const {data} = await apiClient.post<ChatResponse>('/api/chat', body, {timeout: 60_000});
    return data;
  },
};
