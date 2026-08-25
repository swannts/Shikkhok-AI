import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/notification_item_dto.dart';
import '../dto/notification_page_dto.dart';
import '../mappers/notification_mapper.dart';
import '../../domain/entities/notification_item.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/repositories/notifications_repository.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  final ApiClient _apiClient;

  NotificationsRepositoryImpl(this._apiClient);

  @override
  Future<NotificationPage> getMyNotifications({
    int limit = 20,
    String? cursor,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.notifications,
        queryParameters: {
          'limit': limit,
          if (cursor != null && cursor.isNotEmpty) 'cursor': cursor,
        },
      );

      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      final dto = NotificationPageDto.fromJson(data);
      return NotificationPage(
        items: dto.items.map(NotificationMapper.toDomain).toList(),
        nextCursor: dto.nextCursor,
        hasNext: dto.hasNext,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<int> getUnreadCount() async {
    try {
      final response =
          await _apiClient.dio.get(ApiEndpoints.notificationsUnreadCount);
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final unreadCount = data['unreadCount'];
        if (unreadCount is num) {
          return unreadCount.toInt();
        }
        return int.tryParse(unreadCount?.toString() ?? '') ?? 0;
      }
      return 0;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> markAllAsRead() async {
    try {
      await _apiClient.dio.post(ApiEndpoints.notificationsMarkAllRead);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<NotificationItem> markAsRead(String notificationId) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.notificationMarkRead(notificationId),
      );
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      return NotificationMapper.toDomain(NotificationItemDto.fromJson(data));
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
