class ApiResponseEnvelope<T> {
  final T data;
  final Map<String, dynamic> meta;
  final String? requestId;

  const ApiResponseEnvelope({
    required this.data,
    this.meta = const {},
    this.requestId,
  });

  factory ApiResponseEnvelope.fromResponse(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      if (raw.containsKey('data')) {
        final innerData = raw['data'];
        final rawMeta = raw['meta'];
        final meta = rawMeta is Map<String, dynamic>
            ? rawMeta
            : const <String, dynamic>{};
        final requestId = raw['requestId']?.toString();
        return ApiResponseEnvelope(
          data: innerData as T,
          meta: meta,
          requestId: requestId,
        );
      }
    }
    return ApiResponseEnvelope(
      data: raw as T,
      meta: const {},
      requestId: null,
    );
  }

  static dynamic unwrap(dynamic raw) {
    if (raw is Map<String, dynamic> && raw.containsKey('data')) {
      return raw['data'];
    }
    return raw;
  }

  static T unwrapData<T>(dynamic raw) {
    final unwrapped = unwrap(raw);
    return unwrapped as T;
  }

  static List<dynamic> unwrapList(dynamic raw) {
    final unwrapped = unwrap(raw);
    if (unwrapped is List<dynamic>) return unwrapped;
    return const [];
  }

  static Map<String, dynamic> unwrapMap(dynamic raw) {
    final unwrapped = unwrap(raw);
    if (unwrapped is Map<String, dynamic>) return unwrapped;
    if (raw is Map<String, dynamic>) return raw;
    return const {};
  }

  static Map<String, dynamic> extractMeta(dynamic raw) {
    if (raw is Map<String, dynamic> && raw.containsKey('meta')) {
      final meta = raw['meta'];
      if (meta is Map<String, dynamic>) return meta;
    }
    return const {};
  }
}
