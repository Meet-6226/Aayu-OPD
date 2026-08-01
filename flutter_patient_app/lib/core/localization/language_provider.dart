// lib/core/localization/language_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_translations.dart';

class LanguageNotifier extends StateNotifier<String> {
  LanguageNotifier() : super('en'); // Default English

  void setLanguage(String code) {
    if (AppTranslations.translations.containsKey(code)) {
      state = code;
    }
  }

  String translate(String key) {
    final langMap = AppTranslations.translations[state] ?? AppTranslations.translations['en']!;
    return langMap[key] ?? AppTranslations.translations['en']![key] ?? key;
  }
}

final languageProvider = StateNotifierProvider<LanguageNotifier, String>((ref) {
  return LanguageNotifier();
});
