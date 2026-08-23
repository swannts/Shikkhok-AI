import { LLMProvider } from './provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider, ClaudeProvider } from './other.providers';

export class ProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();

  constructor() {
    this.registerProvider('gemini', new GeminiProvider());
    this.registerProvider('openai', new OpenAIProvider());
    this.registerProvider('claude', new ClaudeProvider());
  }

  public registerProvider(key: string, provider: LLMProvider) {
    this.providers.set(key.toLowerCase(), provider);
  }

  public getProvider(name?: string): LLMProvider {
    const key = (name || 'gemini').toLowerCase();
    const provider = this.providers.get(key);
    if (!provider) {
      console.warn(`[ProviderRegistry] Provider '${name}' not found. Falling back to GeminiProvider.`);
      return this.providers.get('gemini')!;
    }
    return provider;
  }
}

export const providerRegistry = new ProviderRegistry();
