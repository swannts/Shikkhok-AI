import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/router/app_routes.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/theme_mode_controller.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  bool _highContrast = false;
  bool _studyReminder = true;
  bool _voiceAssistant = true;
  double _textSize = 1.0; // 0.8: Small, 1.0: Medium, 1.2: Large
  SharedPreferences? _prefs;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    _prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _highContrast = _prefs?.getBool('highContrast') ?? false;
      _studyReminder = _prefs?.getBool('studyReminder') ?? true;
      _voiceAssistant = _prefs?.getBool('voiceAssistant') ?? true;
      _textSize = _prefs?.getDouble('textSize') ?? 1.0;
    });
  }

  Future<void> _saveBool(String key, bool value) async {
    await _prefs?.setBool(key, value);
  }

  Future<void> _saveDouble(String key, double value) async {
    await _prefs?.setDouble(key, value);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDarkMode = ref.watch(themeModeProvider) == ThemeMode.dark;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => AppRoutes.back(context,
              fallbackLocation: AppRoutes.studentProfile),
        ),
        title: Text(
          l10n.settingsTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // General App Settings
              const Text('সাধারণ সেটিংস',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary)),
              const SizedBox(height: AppSpacing.sm),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.language_rounded,
                          color: AppColors.primary),
                      title: Text('ভাষা (Language)',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withAlpha(20),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('বাংলা',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary)),
                      ),
                    ),
                    Divider(height: 1, color: AppColors.border),
                    SwitchListTile(
                      secondary: const Icon(Icons.dark_mode_rounded,
                          color: AppColors.primary),
                      title: Text('ডার্ক মোড (Dark Mode)',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      value: isDarkMode,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) {
                        ref.read(themeModeProvider.notifier).setDarkMode(val);
                      },
                    ),
                    Divider(height: 1, color: AppColors.border),
                    SwitchListTile(
                      secondary: const Icon(Icons.notifications_active_rounded,
                          color: AppColors.primary),
                      title: Text('স্টাডি রিমাইন্ডার',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: Text('প্রতিদিনের পড়াশোনার নোটিফিকেশন',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      value: _studyReminder,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) {
                        setState(() => _studyReminder = val);
                        _saveBool('studyReminder', val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Accessibility Options
              const Text('অ্যাক্সেসিবিলিটি (Accessibility)',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary)),
              const SizedBox(height: AppSpacing.sm),
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.text_fields_rounded,
                            color: AppColors.primary),
                        const SizedBox(width: 12),
                        Text('ফন্ট সাইজ (Text Size)',
                            style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary)),
                      ],
                    ),
                    Slider(
                      value: _textSize,
                      min: 0.8,
                      max: 1.2,
                      divisions: 2,
                      activeColor: AppColors.primary,
                      label: _textSize == 0.8
                          ? 'ছোট'
                          : (_textSize == 1.0 ? 'মাঝারি' : 'বড়'),
                      onChanged: (val) {
                        setState(() => _textSize = val);
                        _saveDouble('textSize', val);
                      },
                    ),
                    Divider(height: 16, color: AppColors.border),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      secondary: const Icon(Icons.contrast_rounded,
                          color: AppColors.primary),
                      title: Text('হাই কনট্রাস্ট মোড',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: Text('লেখা স্পষ্ট দেখতে বেশি কনট্রাস্ট',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      value: _highContrast,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) {
                        setState(() => _highContrast = val);
                        _saveBool('highContrast', val);
                      },
                    ),
                    Divider(height: 16, color: AppColors.border),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      secondary: const Icon(Icons.record_voice_over_rounded,
                          color: AppColors.primary),
                      title: Text('ভয়েস অ্যাসিস্ট্যান্ট প্রম্পট',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: Text('উত্তর পড়ে শোনানোর সুবিধা',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      value: _voiceAssistant,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) {
                        setState(() => _voiceAssistant = val);
                        _saveBool('voiceAssistant', val);
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
