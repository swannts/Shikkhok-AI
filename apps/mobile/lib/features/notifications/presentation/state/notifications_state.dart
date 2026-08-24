import '../../domain/entities/notification_item.dart';

class NotificationsState {
  final List<NotificationItem> items;
  final bool isInitialLoading;
  final bool isLoadingMore;
  final bool hasNext;
  final String? nextCursor;
  final int unreadCount;
  final String? errorMessage;

  const NotificationsState({
    required this.items,
    required this.isInitialLoading,
    required this.isLoadingMore,
    required this.hasNext,
    required this.nextCursor,
    required this.unreadCount,
    required this.errorMessage,
  });

  const NotificationsState.initial()
      : items = const [],
        isInitialLoading = true,
        isLoadingMore = false,
        hasNext = false,
        nextCursor = null,
        unreadCount = 0,
        errorMessage = null;

  NotificationsState copyWith({
    List<NotificationItem>? items,
    bool? isInitialLoading,
    bool? isLoadingMore,
    bool? hasNext,
    String? nextCursor,
    int? unreadCount,
    String? errorMessage,
  }) {
    return NotificationsState(
      items: items ?? this.items,
      isInitialLoading: isInitialLoading ?? this.isInitialLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasNext: hasNext ?? this.hasNext,
      nextCursor: nextCursor ?? this.nextCursor,
      unreadCount: unreadCount ?? this.unreadCount,
      errorMessage: errorMessage,
    );
  }
}
