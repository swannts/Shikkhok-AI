class NotificationItemDto {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool isRead;
  final String? createdAt;

  const NotificationItemDto({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItemDto.fromJson(Map<String, dynamic> json) {
    return NotificationItemDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      body: (json['body'] ?? '').toString(),
      type: (json['type'] ?? 'system').toString(),
      isRead: json['isRead'] == true,
      createdAt: json['createdAt']?.toString(),
    );
  }
}
