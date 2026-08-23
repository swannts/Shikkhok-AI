export interface TutorMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TutorRequest {
  messages: TutorMessageInput[];
  topicId?: string;
  classLevel?: string;
  subject?: string;
  model?: string;
}

export interface LLMProvider {
  name: string;
  streamChat(input: TutorRequest): AsyncIterable<string>;
}
