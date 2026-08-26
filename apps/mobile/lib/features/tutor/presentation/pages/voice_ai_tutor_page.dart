import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

enum VoiceState { listening, thinking, speaking }

class VoiceAiTutorPage extends StatefulWidget {
  const VoiceAiTutorPage({super.key});

  @override
  State<VoiceAiTutorPage> createState() => _VoiceAiTutorPageState();
}

class _VoiceAiTutorPageState extends State<VoiceAiTutorPage>
    with SingleTickerProviderStateMixin {
  VoiceState _voiceState = VoiceState.listening;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  String _getStateTitle(AppLocalizations l10n) {
    switch (_voiceState) {
      case VoiceState.listening:
        return l10n.listeningMode;
      case VoiceState.thinking:
        return l10n.thinkingMode;
      case VoiceState.speaking:
        return l10n.speakingMode;
    }
  }

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
          onPressed: () => context.go('/ai-tutor-chat'),
        ),
        title: Text(
          l10n.voiceTutorTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded,
                color: AppColors.textSecondary),
            onSelected: (value) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$value মোড সক্রিয় করা হয়েছে'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'স্বাভাবিক গতি',
                child: Text('স্বাভাবিক গতি (1.0x)'),
              ),
              const PopupMenuItem(
                value: 'ধীর গতি',
                child: Text('ধীর গতি (0.8x)'),
              ),
              const PopupMenuItem(
                value: 'উচ্চ স্পষ্টতা',
                child: Text('উচ্চ অডিও স্পষ্টতা'),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Context Sub-header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.white.withAlpha(180),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'গণিত • সরল সমীকরণ',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // Central Pulsing Mic Area
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          if (_voiceState == VoiceState.listening) {
                            _voiceState = VoiceState.thinking;
                          } else if (_voiceState == VoiceState.thinking) {
                            _voiceState = VoiceState.speaking;
                          } else {
                            _voiceState = VoiceState.listening;
                          }
                        });
                      },
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Container(
                            width: 160 + (_pulseController.value * 20),
                            height: 160 + (_pulseController.value * 20),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withAlpha(
                                  20 + (_pulseController.value * 30).toInt()),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Container(
                              width: 100,
                              height: 100,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary,
                                    blurRadius: 16,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: Icon(
                                _voiceState == VoiceState.speaking
                                    ? Icons.volume_up_rounded
                                    : (_voiceState == VoiceState.thinking
                                        ? Icons.psychology_rounded
                                        : Icons.mic_rounded),
                                color: Colors.white,
                                size: 48,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      _getStateTitle(l10n),
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    const Text(
                      'মাইক বাটন ট্যাপ করে পরিবর্তন করুন',
                      style: TextStyle(
                          fontSize: 13, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    // Live Transcription Bubble
                    Container(
                      margin:
                          const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(15),
                        borderRadius: BorderRadius.circular(16),
                        border:
                            Border.all(color: AppColors.primary.withAlpha(40)),
                      ),
                      child: const Text(
                        'স্যার, এই সমীকরণটা কীভাবে সমাধান করবো?',
                        style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Action Controls Bar
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  OutlinedButton.icon(
                    onPressed: () => context.go('/ai-tutor-chat'),
                    icon: const Icon(Icons.keyboard_outlined,
                        color: AppColors.primary),
                    label: Text(l10n.typeQuestion,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(
                          color: AppColors.primary, width: 1.5),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(36),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(10),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Container(
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.mic_rounded,
                                color: Colors.white),
                            onPressed: () => setState(
                                () => _voiceState = VoiceState.listening),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.volume_up_rounded,
                              color: AppColors.primary),
                          onPressed: () =>
                              setState(() => _voiceState = VoiceState.speaking),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.red.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.close_rounded,
                                color: Colors.red),
                            onPressed: () => context.go('/ai-tutor-chat'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
