import 'dart:async';
import 'dart:convert';
import 'sse_event.dart';

class SseParser extends StreamTransformerBase<List<int>, SseEvent> {
  const SseParser();

  @override
  Stream<SseEvent> bind(Stream<List<int>> stream) {
    return stream.transform(utf8.decoder).transform(const _SseStringParser());
  }
}

class _SseStringParser extends StreamTransformerBase<String, SseEvent> {
  const _SseStringParser();

  @override
  Stream<SseEvent> bind(Stream<String> stream) {
    late StreamController<SseEvent> controller;
    late StreamSubscription<String> subscription;
    String buffer = '';

    controller = StreamController<SseEvent>(
      onListen: () {
        subscription = stream.listen(
          (chunk) {
            buffer += chunk;
            _parseBuffer(buffer, controller, (newBuffer) {
              buffer = newBuffer;
            });
          },
          onError: controller.addError,
          onDone: () {
            // Process any remaining complete events
            _parseBuffer(buffer, controller, (newBuffer) {
              buffer = newBuffer;
            });
            controller.close();
          },
          cancelOnError: false,
        );
      },
      onPause: () => subscription.pause(),
      onResume: () => subscription.resume(),
      onCancel: () => subscription.cancel(),
    );

    return controller.stream;
  }

  void _parseBuffer(
    String buffer,
    StreamController<SseEvent> controller,
    void Function(String remaining) onUpdateBuffer,
  ) {
    // Look for double newlines: \r\n\r\n or \n\n
    while (true) {
      int boundaryIndex = -1;
      int delimiterLength = 0;

      final crlfIndex = buffer.indexOf('\r\n\r\n');
      final lfIndex = buffer.indexOf('\n\n');

      if (crlfIndex != -1 && (lfIndex == -1 || crlfIndex < lfIndex)) {
        boundaryIndex = crlfIndex;
        delimiterLength = 4;
      } else if (lfIndex != -1) {
        boundaryIndex = lfIndex;
        delimiterLength = 2;
      }

      if (boundaryIndex == -1) {
        break;
      }

      final rawEvent = buffer.substring(0, boundaryIndex);
      buffer = buffer.substring(boundaryIndex + delimiterLength);

      final event = _parseEventBlock(rawEvent);
      if (event != null) {
        controller.add(event);
      }
    }

    onUpdateBuffer(buffer);
  }

  SseEvent? _parseEventBlock(String rawBlock) {
    final lines = rawBlock.split(RegExp(r'\r?\n'));
    String? eventType;
    String? id;
    int? retry;
    final dataLines = <String>[];

    for (final line in lines) {
      if (line.isEmpty || line.startsWith(':')) {
        // Comment or empty line
        continue;
      }

      final colonIndex = line.indexOf(':');
      final String field;
      final String value;

      if (colonIndex == -1) {
        field = line;
        value = '';
      } else {
        field = line.substring(0, colonIndex);
        var rawValue = line.substring(colonIndex + 1);
        if (rawValue.startsWith(' ')) {
          rawValue = rawValue.substring(1);
        }
        value = rawValue;
      }

      switch (field) {
        case 'event':
          eventType = value;
          break;
        case 'data':
          dataLines.add(value);
          break;
        case 'id':
          id = value;
          break;
        case 'retry':
          retry = int.tryParse(value);
          break;
      }
    }

    if (dataLines.isEmpty && eventType == null) {
      return null;
    }

    return SseEvent(
      event: eventType,
      id: id,
      data: dataLines.join('\n'),
      retry: retry,
    );
  }
}
