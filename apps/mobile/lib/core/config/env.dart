class ENV {
  static const String appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'development');
  static const bool useMockApi = bool.fromEnvironment('USE_MOCK_API', defaultValue: true);
  static const String apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:4000/api/v1');
  static const String aiGatewayUrl = String.fromEnvironment('AI_GATEWAY_URL', defaultValue: 'http://localhost:4001/ai/v1');
}
