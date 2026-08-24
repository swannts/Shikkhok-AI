import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class AiTutorChatVariantPage extends StatefulWidget {
  const AiTutorChatVariantPage({super.key});

  @override
  State<AiTutorChatVariantPage> createState() => _AiTutorChatVariantPageState();
}

class _AiTutorChatVariantPageState extends State<AiTutorChatVariantPage> {
  bool _showReconnectBanner = true;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/ai-tutor-chat'),
        ),
        title: Text(
          l10n.aiTutorTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Reconnect Banner
            if (_showReconnectBanner)
              Container(
                color: Colors.amber.shade100,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 8),
                child: Row(
                  children: [
                    const Icon(Icons.wifi_off_rounded, size: 18, color: Colors.amber),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'ইন্টারনেট সংযোগ দুর্বল। পুনরায় সংযোগ হচ্ছে...',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.amber),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 16, color: Colors.amber),
                      onPressed: () => setState(() => _showReconnectBanner = false),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(color: AppColors.primary),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      l10n.thinking,
                      style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
