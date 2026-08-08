import { ITutorRepository } from '../interfaces/IRepositories';
import { TutorMessage } from '../../types';
import { aiGatewayClient } from '../../httpClient';

export class ApiTutorRepository implements ITutorRepository {
  async getConversationHistory(topicId?: string): Promise<TutorMessage[]> {
    return aiGatewayClient.get<TutorMessage[]>(`/tutor/history?topicId=${topicId || 'global'}`);
  }

  async sendMessage(
    userText: string,
    onChunk?: (partialText: string) => void,
    signal?: AbortSignal
  ): Promise<TutorMessage> {
    const fullText = await aiGatewayClient.streamText(
      '/tutor/chat/stream',
      { message: userText },
      (chunk) => {
        if (onChunk) onChunk(chunk);
      },
      { signal }
    );

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: fullText,
      createdAt: new Date().toISOString(),
      actions: [
        { label: 'হিন্ট দাও', actionKey: 'hint' },
        { label: 'আরও সহজ করে বলো', actionKey: 'simpler' },
        { label: 'আমি বুঝেছি', actionKey: 'understood' },
      ],
    };
  }
}
