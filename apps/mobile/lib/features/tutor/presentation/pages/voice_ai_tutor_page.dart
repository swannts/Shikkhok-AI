import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../controllers/tutor_controller.dart';
import '../widgets/lesson_voice_tutor_sheet.dart';

class VoiceAiTutorPage extends ConsumerStatefulWidget {
  const VoiceAiTutorPage({super.key});

  @override
  ConsumerState<VoiceAiTutorPage> createState() => _VoiceAiTutorPageState();
}

class _VoiceAiTutorPageState extends ConsumerState<VoiceAiTutorPage> {
  bool _isStarting = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    unawaited(_ensureConversation());
  }

  Future<void> _ensureConversation() async {
    final controller = ref.read(tutorControllerProvider.notifier);
    await controller.startConversation(
      title: 'ভয়েসে AI শিক্ষকের সঙ্গে কথা',
      initialMessage:
          'আমাকে আমার শ্রেণির একটি বিষয় সহজ করে শেখাও। প্রথমে জিজ্ঞেস করো আমি কোন বিষয় বা পাঠ শিখতে চাই।',
    );
    if (!mounted) return;
    final tutorState = ref.read(tutorControllerProvider);
    setState(() {
      _isStarting = false;
      _errorMessage = tutorState.activeConversation == null
          ? tutorState.errorMessage ?? 'AI শিক্ষকের সঙ্গে সংযোগ করা যায়নি।'
          : null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.aiTutorChat),
        ),
        title: const Text(
          'ভয়েসে AI শিক্ষকের সঙ্গে কথা',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
      body: SafeArea(
        child: _isStarting
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              )
            : _errorMessage != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.wifi_off_rounded,
                              color: AppColors.textSecondary, size: 42),
                          const SizedBox(height: AppSpacing.md),
                          Text(_errorMessage!, textAlign: TextAlign.center),
                          const SizedBox(height: AppSpacing.md),
                          OutlinedButton.icon(
                            onPressed: () {
                              setState(() {
                                _isStarting = true;
                                _errorMessage = null;
                              });
                              unawaited(_ensureConversation());
                            },
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('আবার চেষ্টা করো'),
                          ),
                        ],
                      ),
                    ),
                  )
                : const LessonVoiceTutorSheet(
                    voiceOnly: true,
                    speakOpeningMessageOnStart: true,
                    subjectTitle: 'তোমার শ্রেণির পড়াশোনা',
                    lessonTitle: 'যেকোনো প্রশ্ন করো',
                  ),
      ),
    );
  }
}
