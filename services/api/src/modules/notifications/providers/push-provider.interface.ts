export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  badge?: number;
}

export interface PushDeliveryResult {
  successfulTokens: string[];
  failedTokens: string[];
  invalidTokens: string[];
}

export interface PushProvider {
  readonly name: string;
  sendPush(tokens: string[], payload: PushPayload): Promise<PushDeliveryResult>;
}
