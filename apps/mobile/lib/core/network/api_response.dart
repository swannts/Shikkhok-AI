class ApiResponse<T> {
  final T data;
  final Map<String, dynamic>? meta;
  final String? requestId;

  const ApiResponse({
    required this.data,
    this.meta,
    this.requestId,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic json) fromJsonT,
  ) {
    return ApiResponse<T>(
      data: fromJsonT(json['data']),
      meta: json['meta'] as Map<String, dynamic>?,
      requestId: json['requestId'] as String?,
    );
  }
}
