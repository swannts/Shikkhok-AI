import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/sse_parser.dart';

void main() {
  group('SseParser Unit Tests', () {
    test('parses single SSE event correctly', () async {
      final input = Stream<List<int>>.fromIterable([
        utf8.encode('event: delta\ndata: {"text":"hello"}\n\n'),
      ]);

      final events = await input.transform(const SseParser()).toList();

      expect(events.length, 1);
      expect(events.first.event, 'delta');
      expect(events.first.data, '{"text":"hello"}');
    });

    test('buffers and reconstructs split chunks across event boundaries',
        () async {
      final input = Stream<List<int>>.fromIterable([
        utf8.encode('event: delta\nda'),
        utf8.encode('ta: {"te'),
        utf8.encode('xt":"hello"}\n\n'),
      ]);

      final events = await input.transform(const SseParser()).toList();

      expect(events.length, 1);
      expect(events.first.event, 'delta');
      expect(events.first.data, '{"text":"hello"}');
    });

    test('handles CRLF line endings', () async {
      final input = Stream<List<int>>.fromIterable([
        utf8.encode('event: delta\r\ndata: {"text":"crlf test"}\r\n\r\n'),
      ]);

      final events = await input.transform(const SseParser()).toList();

      expect(events.length, 1);
      expect(events.first.event, 'delta');
      expect(events.first.data, '{"text":"crlf test"}');
    });

    test('parses multiple events in single stream chunk', () async {
      final input = Stream<List<int>>.fromIterable([
        utf8.encode(
          'event: delta\ndata: {"text":"part 1"}\n\n'
          'event: citation\ndata: {"sourceBook":"গণিত"}\n\n'
          'event: done\ndata: [DONE]\n\n',
        ),
      ]);

      final events = await input.transform(const SseParser()).toList();

      expect(events.length, 3);
      expect(events[0].event, 'delta');
      expect(events[1].event, 'citation');
      expect(events[2].event, 'done');
      expect(events[2].data, '[DONE]');
    });
  });
}
