import 'notification_item.dart';

class NotificationPage {
  final List<NotificationItem> items;
  final String? nextCursor;
  final bool hasNext;

  const NotificationPage({
    required this.items,
    required this.nextCursor,
    required this.hasNext,
  });
}
