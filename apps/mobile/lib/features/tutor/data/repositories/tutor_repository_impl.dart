import 'dart:convert';
import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/network/api_response_envelope.dart';
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
      final unwrapped = ApiResponseEnvelope.unwrap(response.data);
      final list = unwrapped is List<dynamic> ? unwrapped : const [];
      return list
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
      final envelope = ApiResponseEnvelope<dynamic>.fromResponse(response.data);
      final messagesRaw = envelope.data is List<dynamic>
          ? envelope.data as List<dynamic>
          : (envelope.data is Map<String, dynamic>
              ? (envelope.data['messages'] ?? envelope.data['data'] ?? const [])
              : const []);

      final conversationDto = TutorConversationDto.fromJson({
        '_id': conversationId,
        'title': 'AI Tutor',
        'classLevel': 0,
        'curriculumYear': '',
        'messages': messagesRaw,
        'meta': envelope.meta,
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
      final eventType = event.event?.toLowerCase();
      final dataStr = event.data.trim();

      if (eventType == null ||
          !const {'metadata', 'delta', 'citation', 'error', 'done'}
              .contains(eventType)) {
        continue;
      }

      if (dataStr == '[DONE]') {
        yield const TutorDoneEvent();
        break;
      }

      try {
        final decoded = jsonDecode(dataStr);
        if (decoded is Map<String, dynamic>) {
          switch (eventType) {
            case 'metadata':
              final grounded = decoded['grounded'];
              final retrievalUnavailable = decoded['retrievalUnavailable'];
              if (grounded is! bool ||
                  retrievalUnavailable is! bool ||
                  (grounded && retrievalUnavailable)) {
                break;
              }
              yield TutorMetadataEvent(
                provider: (decoded['provider'] ?? 'gemini').toString(),
                grounded: grounded,
                retrievalUnavailable: retrievalUnavailable,
                groundingMode: decoded['groundingMode'] is String
                    ? decoded['groundingMode'] as String
                    : null,
                raw: decoded,
              );
              break;
            case 'delta':
              final rawText = decoded['text'] ?? decoded['delta'];
              if (rawText is! String) {
                break;
              }
              final text = rawText;
              if (text.isNotEmpty) {
                yield TutorTextDeltaEvent(text);
              }
              break;
            case 'citation':
              final sourceId = decoded['sourceId'];
              final sourceBook = decoded['sourceBook'];
              final excerpt = decoded['excerpt'] ?? decoded['textChunk'];
              if (sourceId is! String ||
                  sourceId.trim().isEmpty ||
                  sourceBook is! String ||
                  sourceBook.trim().isEmpty ||
                  excerpt is! String ||
                  excerpt.trim().isEmpty) {
                break;
              }
              final citationDto = TutorCitationDto.fromJson(decoded);
              yield TutorCitationEvent(TutorMapper.toCitation(citationDto));
              break;
            case 'error':
              if (decoded['code'] is! String || decoded['message'] is! String) {
                break;
              }
              yield TutorErrorEvent(
                code: decoded['code'] as String,
                message: decoded['message'] as String,
              );
              break;
            case 'done':
              yield TutorDoneEvent(
                messageId: decoded['messageId']?.toString(),
                conversationId: decoded['conversationId']?.toString(),
              );
              break;
            default:
              break;
          }
        }
      } catch (_) {
        // Ignore malformed frames; never reinterpret protocol errors as answer text.
      }
    }
  }

  TutorConversationThread _toThread(dynamic responseData) {
    final unwrapped = ApiResponseEnvelope.unwrap(responseData);
    final data = unwrapped is Map<String, dynamic>
        ? unwrapped
        : (responseData is Map<String, dynamic>
            ? responseData
            : <String, dynamic>{});
    return TutorMapper.toThread(TutorConversationDto.fromJson(data));
  }
}
