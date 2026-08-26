import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_response_envelope.dart';

void main() {
  group('ApiResponseEnvelope Unit Tests', () {
    test('unwraps data payload from standard NestJS envelope', () {
      final raw = {
        'data': {'id': '123', 'name': 'Mathematics'},
        'meta': {'page': 1, 'limit': 20},
        'requestId': 'req-abc-123',
      };

      final envelope =
          ApiResponseEnvelope<Map<String, dynamic>>.fromResponse(raw);
      expect(envelope.data['id'], '123');
      expect(envelope.meta['page'], 1);
      expect(envelope.requestId, 'req-abc-123');
    });

    test('unwrap returns inner data or raw value', () {
      final enveloped = {
        'data': [1, 2, 3],
        'meta': {},
      };
      expect(ApiResponseEnvelope.unwrap(enveloped), [1, 2, 3]);

      final rawList = [1, 2, 3];
      expect(ApiResponseEnvelope.unwrap(rawList), [1, 2, 3]);
    });

    test('unwrapList returns list or empty fallback', () {
      final enveloped = {
        'data': ['a', 'b', 'c'],
      };
      expect(ApiResponseEnvelope.unwrapList(enveloped), ['a', 'b', 'c']);

      final invalid = {'data': 123};
      expect(ApiResponseEnvelope.unwrapList(invalid), isEmpty);
    });

    test('unwrapMap returns map or empty fallback', () {
      final enveloped = {
        'data': {'key': 'val'},
      };
      expect(ApiResponseEnvelope.unwrapMap(enveloped), {'key': 'val'});
    });

    test('extractMeta returns meta map correctly', () {
      final enveloped = {
        'data': 'test',
        'meta': {'cursor': 'cur_123', 'hasNext': true},
      };
      final meta = ApiResponseEnvelope.extractMeta(enveloped);
      expect(meta['cursor'], 'cur_123');
      expect(meta['hasNext'], true);

      expect(ApiResponseEnvelope.extractMeta('invalid'), isEmpty);
    });
  });
}
