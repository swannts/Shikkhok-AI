import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../domain/entities/tutor_conversation.dart';
import '../../domain/entities/tutor_conversation_thread.dart';
import '../../domain/repositories/tutor_repository.dart';
import '../dto/tutor_conversation_dto.dart';
import '../mappers/tutor_mapper.dart';

class TutorRepositoryImpl implements TutorRepository {
  final ApiClient _apiClient;

  TutorRepositoryImpl(this._apiClient);

  @override
  Future<List<TutorConversation>> getMyConversations() async {
    try {
      final response =
          await _apiClient.dio.get(ApiEndpoints.tutorConversations);
      final data = response.data is List<dynamic>
          ? response.data as List<dynamic>
          : const [];
      return data
          .whereType<Map<String, dynamic>>()
          .map((json) =>
              TutorMapper.toConversation(TutorConversationDto.fromJson(json)))
          .toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<TutorConversationThread> startConversation({
    String? title,
    String? subjectId,
    String? chapterId,
    String? lessonId,
    String? initialMessage,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.tutorConversations,
        data: {
          if (title != null && title.trim().isNotEmpty) 'title': title.trim(),
          if (subjectId != null && subjectId.isNotEmpty) 'subjectId': subjectId,
          if (chapterId != null && chapterId.isNotEmpty) 'chapterId': chapterId,
          if (lessonId != null && lessonId.isNotEmpty) 'lessonId': lessonId,
          if (initialMessage != null && initialMessage.trim().isNotEmpty)
            'initialMessage': initialMessage.trim(),
        },
      );
      return _toThread(response.data);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<TutorConversationThread> getConversation(
    String conversationId, {
    int limit = 30,
    String? cursor,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.tutorConversation(conversationId),
        queryParameters: {
          'limit': limit,
          if (cursor != null && cursor.isNotEmpty) 'cursor': cursor,
        },
      );
      return _toThread(response.data);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<TutorConversationThread> getConversationMessages(
    String conversationId, {
    int limit = 30,
    String? cursor,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.tutorConversationMessages(conversationId),
        queryParameters: {
          'limit': limit,
          if (cursor != null && cursor.isNotEmpty) 'cursor': cursor,
        },
      );
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      final conversationDto = TutorConversationDto.fromJson({
        '_id': conversationId,
        'title': 'AI Tutor',
        'classLevel': 0,
        'curriculumYear': '',
        'messages': data['data'] ?? const [],
        'meta': data['meta'] ?? const {},
      });
      return TutorMapper.toThread(conversationDto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<TutorConversationThread> sendMessage(
    String conversationId,
    String content,
  ) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.tutorConversationMessages(conversationId),
        data: {'content': content.trim()},
      );
      return _toThread(response.data);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  TutorConversationThread _toThread(dynamic responseData) {
    final data = responseData is Map<String, dynamic>
        ? responseData
        : <String, dynamic>{};
    return TutorMapper.toThread(TutorConversationDto.fromJson(data));
  }
}
