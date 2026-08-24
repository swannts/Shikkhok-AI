import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _darkMode = false;
  bool _highContrast = false;
  bool _studyReminder = true;
  bool _voiceAssistant = true;
  double _textSize = 1.0; // 0.8: Small, 1.0: Medium, 1.2: Large

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/profile'),
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
                      title: const Text('ভাষা (Language)',
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
                    const Divider(height: 1, color: AppColors.border),
                    SwitchListTile(
                      secondary: const Icon(Icons.dark_mode_rounded,
                          color: AppColors.primary),
                      title: const Text('ডার্ক মোড (Dark Mode)',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      value: _darkMode,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) => setState(() => _darkMode = val),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    SwitchListTile(
                      secondary: const Icon(Icons.notifications_active_rounded,
                          color: AppColors.primary),
                      title: const Text('স্টাডি রিমাইন্ডার',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: const Text('প্রতিদিনের পড়াশোনার নোটিফিকেশন',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      value: _studyReminder,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) => setState(() => _studyReminder = val),
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
                    const Row(
                      children: [
                        Icon(Icons.text_fields_rounded,
                            color: AppColors.primary),
                        SizedBox(width: 12),
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
                      onChanged: (val) => setState(() => _textSize = val),
                    ),
                    const Divider(height: 16, color: AppColors.border),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      secondary: const Icon(Icons.contrast_rounded,
                          color: AppColors.primary),
                      title: const Text('হাই কনট্রাস্ট মোড',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: const Text('লেখা স্পষ্ট দেখতে বেশি কনট্রাস্ট',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      value: _highContrast,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) => setState(() => _highContrast = val),
                    ),
                    const Divider(height: 16, color: AppColors.border),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      secondary: const Icon(Icons.record_voice_over_rounded,
                          color: AppColors.primary),
                      title: const Text('ভয়েস অ্যাসিস্ট্যান্ট প্রম্পট',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: const Text('উত্তর পড়ে শোনানোর সুবিধা',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      value: _voiceAssistant,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) => setState(() => _voiceAssistant = val),
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
