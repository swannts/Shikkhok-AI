import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/tutor/presentation/voice_speech_locale.dart';

void main() {
  group('selectBengaliSpeechLocale', () {
    test('prefers a reported Bangladesh Bengali locale', () {
      expect(
        selectBengaliSpeechLocale(['en-US', 'bn-BD', 'bn-IN'], isWeb: true),
        'bn-BD',
      );
    });

    test('requests Bengali on web when the adapter lists only browser locale',
        () {
      expect(
        selectBengaliSpeechLocale(['en-US'], isWeb: true),
        'bn-BD',
      );
    });

    test('does not invent an installed native locale', () {
      expect(
        selectBengaliSpeechLocale(['en-US'], isWeb: false),
        isNull,
      );
    });
  });
}
