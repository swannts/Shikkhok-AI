import 'notification_item_dto.dart';

class NotificationPageDto {
  final List<NotificationItemDto> items;
  final String? nextCursor;
  final bool hasNext;

  const NotificationPageDto({
    required this.items,
    required this.nextCursor,
    required this.hasNext,
  });

  factory NotificationPageDto.fromJson(Map<String, dynamic> json) {
    final data = (json['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(NotificationItemDto.fromJson)
        .toList();
    final meta = json['meta'] as Map<String, dynamic>? ?? const {};

    return NotificationPageDto(
      items: data,
      nextCursor: meta['nextCursor']?.toString(),
      hasNext: meta['hasNext'] == true,
    );
  }
}
