/// Turns streamed tutor text into short, speakable utterances.
///
/// Keeping this separate from the speech engine makes sentence boundaries
/// deterministic and easy to test with Bengali and mixed-language responses.
class VoiceReplyChunker {
  String _buffer = '';

  List<String> add(String delta) {
    _buffer += delta;
    final chunks = <String>[];

    while (true) {
      final boundary = _findSentenceBoundary(_buffer);
      if (boundary == -1) break;

      final sentence = _buffer.substring(0, boundary + 1).trim();
      if (sentence.isNotEmpty) chunks.add(sentence);
      _buffer = _buffer.substring(boundary + 1).trimLeft();
    }

    return chunks;
  }

  String flush() {
    final remainder = _buffer.trim();
    _buffer = '';
    return remainder;
  }

  void reset() => _buffer = '';

  int _findSentenceBoundary(String text) {
    for (var index = 0; index < text.length; index++) {
      final char = text[index];
      if (char == '।' || char == '!' || char == '?' || char == '؟') {
        return index;
      }
      if (char == '.') {
        final isDecimalPoint = index > 0 &&
            index + 1 < text.length &&
            _isDigit(text[index - 1]) &&
            _isDigit(text[index + 1]);
        if (!isDecimalPoint &&
            (index + 1 == text.length || text[index + 1].trim().isEmpty)) {
          return index;
        }
      }
    }
    return -1;
  }

  bool _isDigit(String char) =>
      char.codeUnitAt(0) >= 48 && char.codeUnitAt(0) <= 57;
}
