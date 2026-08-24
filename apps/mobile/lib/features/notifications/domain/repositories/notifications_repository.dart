import '../entities/notification_item.dart';
import '../entities/notification_page.dart';

abstract interface class NotificationsRepository {
  Future<NotificationPage> getMyNotifications({
    int limit,
    String? cursor,
  });

  Future<int> getUnreadCount();

  Future<void> markAllAsRead();

  Future<NotificationItem> markAsRead(String notificationId);
}
