import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/errors/app_failure.dart';
import '../../data/repositories/notifications_repository_impl.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../state/notifications_state.dart';

final notificationsApiClientProvider = Provider<ApiClient>((ref) => apiClient);

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  return NotificationsRepositoryImpl(ref.read(notificationsApiClientProvider));
});

final notificationsControllerProvider =
    StateNotifierProvider<NotificationsController, NotificationsState>((ref) {
  return NotificationsController(ref.read(notificationsRepositoryProvider));
});

class NotificationsController extends StateNotifier<NotificationsState> {
  final NotificationsRepository _repository;

  NotificationsController(this._repository)
      : super(const NotificationsState.initial());

  Future<void> loadInitial() async {
    state = state.copyWith(isInitialLoading: true, errorMessage: null);
    try {
      final unreadCountFuture = _repository.getUnreadCount();
      final pageFuture = _repository.getMyNotifications(limit: 20);
      final unreadCount = await unreadCountFuture;
      final page = await pageFuture;
      state = state.copyWith(
        items: page.items,
        unreadCount: unreadCount,
        hasNext: page.hasNext,
        nextCursor: page.nextCursor,
        isInitialLoading: false,
        isLoadingMore: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(
        isInitialLoading: false,
        errorMessage: e.banglaMessage,
      );
    } catch (e) {
      state = state.copyWith(
        isInitialLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> refresh() async {
    await loadInitial();
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasNext || state.nextCursor == null) {
      return;
    }

    state = state.copyWith(isLoadingMore: true, errorMessage: null);
    try {
      final page = await _repository.getMyNotifications(
        limit: 20,
        cursor: state.nextCursor,
      );
      state = state.copyWith(
        items: [...state.items, ...page.items],
        hasNext: page.hasNext,
        nextCursor: page.nextCursor,
        isLoadingMore: false,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(isLoadingMore: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, errorMessage: e.toString());
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _repository.markAllAsRead();
      state = state.copyWith(
        unreadCount: 0,
        items: state.items.map((item) => item.copyWith(isRead: true)).toList(),
      );
    } on AppFailure catch (e) {
      state = state.copyWith(errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  Future<void> markAsRead(String notificationId) async {
    final current = state.items;
    final selected = current.where((item) => item.id == notificationId).toList();
    if (selected.isEmpty) {
      return;
    }
    if (selected.first.isRead) {
      return;
    }

    try {
      final updated = await _repository.markAsRead(notificationId);
      final nextItems = current
          .map(
            (item) => item.id == notificationId ? updated.copyWith(isRead: true) : item,
          )
          .toList();
      final nextUnreadCount = state.unreadCount > 0 ? state.unreadCount - 1 : 0;
      state = state.copyWith(
        items: nextItems,
        unreadCount: nextUnreadCount,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }
}
