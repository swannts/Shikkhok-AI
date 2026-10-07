import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/tutor/presentation/voice_reply_chunker.dart';

void main() {
  group('VoiceReplyChunker', () {
    test('emits Bengali sentences as soon as punctuation arrives', () {
      final chunker = VoiceReplyChunker();

      expect(chunker.add('যোগ মানে দুই বা তার বেশি সংখ্যা'), isEmpty);
      expect(chunker.add(' একসঙ্গে করা। এরপর উদাহরণ'),
          ['যোগ মানে দুই বা তার বেশি সংখ্যা একসঙ্গে করা।']);
      expect(chunker.flush(), 'এরপর উদাহরণ');
    });

    test('does not split decimal values at their decimal point', () {
      final chunker = VoiceReplyChunker();

      expect(chunker.add('৩.১৪ একটি মান। পরের বাক্য।'),
          ['৩.১৪ একটি মান।', 'পরের বাক্য।']);
      expect(chunker.flush(), isEmpty);
    });

    test('flush returns any final text without punctuation', () {
      final chunker = VoiceReplyChunker()..add('শেষ কথাটি');

      expect(chunker.flush(), 'শেষ কথাটি');
      expect(chunker.flush(), isEmpty);
    });
  });
}
