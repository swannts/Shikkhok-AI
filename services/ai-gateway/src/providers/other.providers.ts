import { LLMProvider, TutorRequest } from './provider.interface';

export class OpenAIProvider implements LLMProvider {
  public name = 'OpenAIProvider';

  async *streamChat(input: TutorRequest): AsyncIterable<string> {
    const text = '[OpenAIProvider Placeholder] OpenAI integration is ready for API key configuration.';
    yield text;
  }
}

export class ClaudeProvider implements LLMProvider {
  public name = 'ClaudeProvider';

  async *streamChat(input: TutorRequest): AsyncIterable<string> {
    const text = '[ClaudeProvider Placeholder] Claude Anthropic integration is ready for API key configuration.';
    yield text;
  }
}
