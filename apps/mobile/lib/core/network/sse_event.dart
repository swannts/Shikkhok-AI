class SseEvent {
  final String? event;
  final String? id;
  final String data;
  final int? retry;

  const SseEvent({
    this.event,
    this.id,
    required this.data,
    this.retry,
  });

  @override
  String toString() =>
      'SseEvent(event: $event, id: $id, data: $data, retry: $retry)';
}
