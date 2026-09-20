import { LLMProvider, TutorRequest } from './provider.interface';

export class OpenAIProvider implements LLMProvider {
  public name = 'OpenAIProvider';

  async *streamChat(input: TutorRequest): AsyncIterable<string> {
    throw new Error('OpenAI provider is not configured for this gateway');
  }
}

export class ClaudeProvider implements LLMProvider {
  public name = 'ClaudeProvider';

  async *streamChat(input: TutorRequest): AsyncIterable<string> {
    throw new Error('Claude provider is not configured for this gateway');
  }
}
