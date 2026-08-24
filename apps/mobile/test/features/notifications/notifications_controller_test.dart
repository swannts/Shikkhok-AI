import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/notifications/domain/entities/notification_item.dart';
import 'package:mobile/features/notifications/domain/entities/notification_page.dart';
import 'package:mobile/features/notifications/domain/repositories/notifications_repository.dart';
import 'package:mobile/features/notifications/presentation/controllers/notifications_controller.dart';
import 'package:mobile/features/notifications/presentation/state/notifications_state.dart';

class FakeNotificationsRepository implements NotificationsRepository {
  FakeNotificationsRepository({
    required List<NotificationItem> initialItems,
  }) : _items = List<NotificationItem>.from(initialItems);

  final List<NotificationItem> _items;

  @override
  Future<int> getUnreadCount() async => _items.where((item) => !item.isRead).length;

  @override
  Future<NotificationPage> getMyNotifications({
    int limit = 20,
    String? cursor,
  }) async {
    return NotificationPage(
      items: List<NotificationItem>.from(_items),
      nextCursor: null,
      hasNext: false,
    );
  }

  @override
  Future<void> markAllAsRead() async {
    for (var i = 0; i < _items.length; i++) {
      _items[i] = _items[i].copyWith(isRead: true);
    }
  }

  @override
  Future<NotificationItem> markAsRead(String notificationId) async {
    final index = _items.indexWhere((item) => item.id == notificationId);
    if (index == -1) {
      throw StateError('Notification not found');
    }

    final updated = _items[index].copyWith(isRead: true);
    _items[index] = updated;
    return updated;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('NotificationsController', () {
    late FakeNotificationsRepository repository;
    late NotificationsController controller;

    setUp(() {
      repository = FakeNotificationsRepository(
        initialItems: [
          NotificationItem(
            id: 'notif-1',
            title: 'স্টাডি প্ল্যান আপডেট',
            body: 'আপনার পরিকল্পনা প্রস্তুত হয়েছে।',
            type: 'study_plan',
            isRead: false,
            createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
          ),
          NotificationItem(
            id: 'notif-2',
            title: 'রিপোর্ট এসেছে',
            body: 'নতুন অগ্রগতি রিপোর্ট তৈরি হয়েছে।',
            type: 'progress',
            isRead: true,
            createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          ),
        ],
      );
      controller = NotificationsController(repository);
    });

    test('loadInitial loads notifications and unread count', () async {
      await controller.loadInitial();

      expect(controller.state, isA<NotificationsState>());
      expect(controller.state.items, hasLength(2));
      expect(controller.state.unreadCount, 1);
      expect(controller.state.hasNext, isFalse);
      expect(controller.state.isInitialLoading, isFalse);
    });

    test('markAsRead updates a notification locally and decrements unread count',
        () async {
      await controller.loadInitial();

      await controller.markAsRead('notif-1');

      final updated = controller.state.items.firstWhere((item) => item.id == 'notif-1');
      expect(updated.isRead, isTrue);
      expect(controller.state.unreadCount, 0);
    });

    test('markAllAsRead clears unread count for all items', () async {
      await controller.loadInitial();

      await controller.markAllAsRead();

      expect(controller.state.unreadCount, 0);
      expect(controller.state.items.every((item) => item.isRead), isTrue);
    });
  });
}
