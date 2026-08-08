export interface EnvironmentConfig {
  appEnv: 'development' | 'staging' | 'production';
  useMockApi: boolean;
  apiBaseUrl: string;
  aiGatewayUrl: string;
}

const appEnv =
  (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') || 'development';
const useMockApi = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
const aiGatewayUrl = process.env.EXPO_PUBLIC_AI_GATEWAY_URL || 'http://localhost:4001/ai/v1';

// Strict validation for staging & production environments
if (appEnv !== 'development' && !useMockApi) {
  if (!process.env.EXPO_PUBLIC_API_BASE_URL || apiBaseUrl.includes('localhost')) {
    throw new Error(
      `[Env Error] EXPO_PUBLIC_API_BASE_URL is missing or set to localhost in ${appEnv} environment.`
    );
  }
  if (!process.env.EXPO_PUBLIC_AI_GATEWAY_URL || aiGatewayUrl.includes('localhost')) {
    throw new Error(
      `[Env Error] EXPO_PUBLIC_AI_GATEWAY_URL is missing or set to localhost in ${appEnv} environment.`
    );
  }
}

export const ENV: EnvironmentConfig = {
  appEnv,
  useMockApi,
  apiBaseUrl,
  aiGatewayUrl,
};
