import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/sse_event.dart';
import 'package:mobile/features/tutor/data/repositories/tutor_repository_impl.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_stream_event.dart';

class FixedSseApiClient extends ApiClient {
  final List<SseEvent> events;

  FixedSseApiClient(this.events) : super(customDio: Dio());

  @override
  Stream<SseEvent> streamSse(
    String endpoint, {
    Map<String, dynamic>? data,
    CancelToken? cancelToken,
  }) async* {
    yield* Stream<SseEvent>.fromIterable(events);
  }
}

void main() {
  test(
      'drops malformed and unknown tutor frames without converting them to text',
      () async {
    final repository = TutorRepositoryImpl(FixedSseApiClient([
      const SseEvent(event: 'progress', data: '{"text":"fake"}'),
      const SseEvent(event: 'metadata', data: '{"grounded":true}'),
      const SseEvent(event: 'delta', data: '{"text":4}'),
      const SseEvent(event: 'citation', data: '{"sourceBook":"fabricated"}'),
      const SseEvent(event: 'delta', data: '{invalid-json'),
      const SseEvent(
          event: 'metadata',
          data:
              '{"grounded":false,"retrievalUnavailable":true,"groundingMode":"degraded"}'),
      const SseEvent(event: 'delta', data: '{"text":"verified-frame"}'),
      const SseEvent(event: 'done', data: '{}'),
    ]));

    final received =
        await repository.streamMessage('conversation', 'question').toList();
    expect(received, hasLength(3));
    expect(received[0], isA<TutorMetadataEvent>());
    expect((received[1] as TutorTextDeltaEvent).text, 'verified-frame');
    expect(received[2], isA<TutorDoneEvent>());
  });

  test('maps citation pageStart and requires actual citation provenance',
      () async {
    final repository = TutorRepositoryImpl(FixedSseApiClient([
      const SseEvent(
        event: 'citation',
        data:
            '{"sourceId":"chunk-1","sourceBook":"Class 3 Bangla","pageStart":12,"textChunk":"retrieved passage"}',
      ),
    ]));

    final received =
        await repository.streamMessage('conversation', 'question').toList();
    final citation = (received.single as TutorCitationEvent).citation;
    expect(citation.sourceId, 'chunk-1');
    expect(citation.pageNumber, 12);
    expect(citation.excerpt, 'retrieved passage');
  });
}
