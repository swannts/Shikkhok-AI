import 'dart:convert';
import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../domain/entities/tutor_conversation.dart';
import '../../domain/entities/tutor_conversation_thread.dart';
import '../../domain/entities/tutor_stream_event.dart';
import '../../domain/repositories/tutor_repository.dart';
import '../dto/tutor_citation_dto.dart';
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

  @override
  Stream<TutorStreamEvent> streamMessage(
    String conversationId,
    String content, {
    CancelToken? cancelToken,
  }) async* {
    final sseStream = _apiClient.streamSse(
      ApiEndpoints.tutorStreamMessage(conversationId),
      data: {'content': content.trim()},
      cancelToken: cancelToken,
    );

    await for (final event in sseStream) {
      final eventType = event.event?.toLowerCase() ?? 'delta';
      final dataStr = event.data.trim();

      if (dataStr == '[DONE]') {
        yield const TutorDoneEvent();
        break;
      }

      try {
        final decoded = jsonDecode(dataStr);
        if (decoded is Map<String, dynamic>) {
          switch (eventType) {
            case 'metadata':
              yield TutorMetadataEvent(
                provider: (decoded['provider'] ?? 'gemini').toString(),
                grounded: decoded['grounded'] as bool?,
                raw: decoded,
              );
              break;
            case 'delta':
              final text =
                  (decoded['text'] ?? decoded['delta'] ?? '').toString();
              if (text.isNotEmpty) {
                yield TutorTextDeltaEvent(text);
              }
              break;
            case 'citation':
              final citationDto = TutorCitationDto.fromJson(decoded);
              yield TutorCitationEvent(TutorMapper.toCitation(citationDto));
              break;
            case 'error':
              yield TutorErrorEvent(
                code: (decoded['code'] ?? 'STREAM_ERROR').toString(),
                message: (decoded['message'] ?? 'Streaming error').toString(),
              );
              break;
            case 'done':
              yield TutorDoneEvent(
                messageId: decoded['messageId']?.toString(),
                conversationId: decoded['conversationId']?.toString(),
              );
              break;
            default:
              final text = decoded['text']?.toString();
              if (text != null && text.isNotEmpty) {
                yield TutorTextDeltaEvent(text);
              }
          }
        } else if (decoded is String) {
          yield TutorTextDeltaEvent(decoded);
        }
      } catch (_) {
        if (dataStr.isNotEmpty) {
          yield TutorTextDeltaEvent(dataStr);
        }
      }
    }
  }

  TutorConversationThread _toThread(dynamic responseData) {
    final data = responseData is Map<String, dynamic>
        ? responseData
        : <String, dynamic>{};
    return TutorMapper.toThread(TutorConversationDto.fromJson(data));
  }
}
