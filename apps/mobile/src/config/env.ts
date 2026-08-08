export interface EnvironmentConfig {
  appEnv: 'development' | 'staging' | 'production';
  useMockApi: boolean;
  apiBaseUrl: string;
  aiGatewayUrl: string;
}

export const ENV: EnvironmentConfig = {
  appEnv:
    (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') || 'development',
  useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
  aiGatewayUrl: process.env.EXPO_PUBLIC_AI_GATEWAY_URL || 'http://localhost:4001/ai/v1',
};
