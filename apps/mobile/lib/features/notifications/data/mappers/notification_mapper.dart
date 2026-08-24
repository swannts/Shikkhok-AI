import '../../domain/entities/notification_item.dart';
import '../dto/notification_item_dto.dart';

class NotificationMapper {
  static NotificationItem toDomain(NotificationItemDto dto) {
    DateTime createdAt;
    try {
      createdAt = dto.createdAt != null
          ? DateTime.parse(dto.createdAt!)
          : DateTime.now();
    } catch (_) {
      createdAt = DateTime.now();
    }

    return NotificationItem(
      id: dto.id,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      isRead: dto.isRead,
      createdAt: createdAt,
    );
  }
}
