/// Chooses Bengali without assuming that web browsers enumerate recognition
/// locales. speech_to_text's web adapter reports only its current browser
/// locale, while native adapters usually return the installed locale list.
String? selectBengaliSpeechLocale(
  Iterable<String> availableLocales, {
  required bool isWeb,
}) {
  const preferredLocales = ['bn_BD', 'bn-BD', 'bn_IN', 'bn-IN'];
  final locales = availableLocales.toList(growable: false);

  for (final preferred in preferredLocales) {
    for (final locale in locales) {
      if (locale.toLowerCase() == preferred.toLowerCase()) return locale;
    }
  }

  for (final locale in locales) {
    if (locale.toLowerCase().startsWith('bn')) return locale;
  }

  // The plugin's browser adapter returns its current language (often en-US),
  // not the browser's full list of recognition languages. Explicitly request
  // Bangladeshi Bengali in that case and let the browser report unsupported
  // language/microphone errors during start/listen.
  return isWeb ? 'bn-BD' : null;
}
