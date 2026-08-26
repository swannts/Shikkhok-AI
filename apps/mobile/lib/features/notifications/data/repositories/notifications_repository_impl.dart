import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/network/api_response_envelope.dart';
import '../dto/notification_item_dto.dart';
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

      final envelope = ApiResponseEnvelope<dynamic>.fromResponse(response.data);
      final List<dynamic> itemsList;
      if (envelope.data is List<dynamic>) {
        itemsList = envelope.data as List<dynamic>;
      } else if (envelope.data is Map<String, dynamic>) {
        itemsList = (envelope.data['items'] ??
            envelope.data['data'] ??
            const []) as List<dynamic>;
      } else {
        itemsList = const [];
      }

      final items = itemsList
          .whereType<Map<String, dynamic>>()
          .map(NotificationItemDto.fromJson)
          .map(NotificationMapper.toDomain)
          .toList();

      return NotificationPage(
        items: items,
        nextCursor: envelope.meta['nextCursor']?.toString(),
        hasNext: envelope.meta['hasNext'] == true,
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
      final unwrapped = ApiResponseEnvelope.unwrap(response.data);
      if (unwrapped is Map<String, dynamic>) {
        final unreadCount = unwrapped['unreadCount'];
        if (unreadCount is num) {
          return unreadCount.toInt();
        }
        return int.tryParse(unreadCount?.toString() ?? '') ?? 0;
      } else if (unwrapped is num) {
        return unwrapped.toInt();
      }
      return 0;
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
      final unwrapped = ApiResponseEnvelope.unwrap(response.data);
      final data = unwrapped is Map<String, dynamic>
          ? unwrapped
          : (response.data is Map<String, dynamic>
              ? response.data as Map<String, dynamic>
              : <String, dynamic>{});
      return NotificationMapper.toDomain(NotificationItemDto.fromJson(data));
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> markAllAsRead() async {
    try {
      await _apiClient.dio.post(
        ApiEndpoints.notificationsMarkAllRead,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
