import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../domain/entities/tutor_message.dart';
import '../controllers/tutor_controller.dart';
import '../state/tutor_state.dart';

class LessonVoiceTutorSheet extends ConsumerStatefulWidget {
  final String lessonTitle;
  final String? chapterTitle;
  final String? subjectTitle;
  final bool embedded;
  final VoidCallback? onClose;

  const LessonVoiceTutorSheet({
    super.key,
    required this.lessonTitle,
    this.chapterTitle,
    this.subjectTitle,
    this.embedded = false,
    this.onClose,
  });

  @override
  ConsumerState<LessonVoiceTutorSheet> createState() =>
      _LessonVoiceTutorSheetState();
}

class _LessonVoiceTutorSheetState extends ConsumerState<LessonVoiceTutorSheet> {
  final SpeechToText _speech = SpeechToText();
  final FlutterTts _textToSpeech = FlutterTts();
  final TextEditingController _questionController = TextEditingController();
  bool _speechAvailable = false;
  bool _isListening = false;
  bool _isSubmitting = false;
  bool _voiceSessionActive = false;
  bool _isSpeaking = false;
  bool _speakReplies = true;
  String? _speechLocale;
  String _transcript = '';
  String? _voiceError;

  @override
  void initState() {
    super.initState();
    _initializeSpeech();
  }

  Future<void> _initializeSpeech() async {
    try {
      final available = await _speech.initialize(
        onError: (error) {
          if (!mounted) return;
          setState(() {
            _isListening = false;
            _voiceError =
                'কথা শোনা যায়নি। মাইক্রোফোনের অনুমতি দিয়ে আবার চেষ্টা করুন।';
          });
        },
        onStatus: (status) {
          if (!mounted || _isSubmitting) return;
          if (status == 'notListening' || status == 'done') {
            setState(() => _isListening = false);
            if (_voiceSessionActive && _transcript.trim().isNotEmpty) {
              unawaited(_submitQuestion());
            }
          }
        },
      );
      if (!mounted) return;

      String? localeId;
      if (available) {
        final locales = await _speech.locales();
        for (final preferred in ['bn_BD', 'bn-BD', 'bn_IN', 'bn-IN']) {
          final match = locales.where((locale) => locale.localeId == preferred);
          if (match.isNotEmpty) {
            localeId = match.first.localeId;
            break;
          }
        }
        localeId ??= 'bn_BD';
      }
      setState(() {
        _speechAvailable = available;
        _speechLocale = localeId;
        if (!available) {
          _voiceError =
              'এই ব্রাউজার বা ডিভাইসে বাংলা ভয়েস ইনপুট পাওয়া যাচ্ছে না।';
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _speechAvailable = false;
        _voiceError = 'ভয়েস ইনপুট চালু করা যায়নি। চাইলে নিচে লিখে প্রশ্ন করুন।';
      });
    }
  }

  Future<void> _toggleListening() async {
    if (_isSubmitting) return;
    if (_isSpeaking) {
      _voiceSessionActive = false;
      await _textToSpeech.stop();
      if (mounted) setState(() => _isSpeaking = false);
      return;
    }
    if (_isListening) {
      _voiceSessionActive = false;
      await _speech.stop();
      if (mounted) setState(() => _isListening = false);
      return;
    }
    if (!_speechAvailable) {
      setState(() =>
          _voiceError = 'এই ব্রাউজার বা ডিভাইসে ভয়েস ইনপুট পাওয়া যাচ্ছে না।');
      return;
    }

    await _textToSpeech.stop();
    _voiceSessionActive = true;
    await _startListening();
  }

  Future<void> _startListening() async {
    if (!_voiceSessionActive || !_speechAvailable || _isSubmitting) return;
    setState(() {
      _transcript = '';
      _voiceError = null;
      _isListening = true;
    });
    try {
      await _speech.listen(
        onResult: _onSpeechResult,
        listenOptions: SpeechListenOptions(
          localeId: _speechLocale,
          listenFor: const Duration(seconds: 30),
          pauseFor: const Duration(seconds: 4),
          partialResults: true,
          cancelOnError: true,
          listenMode: ListenMode.dictation,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isListening = false;
        _voiceSessionActive = false;
        _voiceError =
            'মাইক্রোফোন চালু করা যায়নি। অনুমতি পরীক্ষা করে আবার চেষ্টা করুন।';
      });
    }
  }

  void _onSpeechResult(SpeechRecognitionResult result) {
    if (!mounted) return;
    final transcript = result.recognizedWords.trim();
    _questionController.value = TextEditingValue(
      text: transcript,
      selection: TextSelection.collapsed(offset: transcript.length),
    );
    setState(() => _transcript = transcript);
    if (result.finalResult && _voiceSessionActive && transcript.isNotEmpty) {
      unawaited(_submitQuestion());
    }
  }

  Future<void> _submitQuestion() async {
    final question = _transcript.trim();
    if (question.isEmpty || _isSubmitting) return;
    setState(() {
      _isSubmitting = true;
      _voiceError = null;
    });
    if (_isListening) {
      await _speech.stop();
    }
    if (!mounted) return;
    setState(() => _isListening = false);

    await ref.read(tutorControllerProvider.notifier).streamMessage(question);
    if (!mounted) return;

    final tutorState = ref.read(tutorControllerProvider);
    final reply = tutorState.messages
        .lastWhere(
          (message) => message.role == TutorMessageRole.assistant,
          orElse: () => TutorMessage(
            id: '',
            role: TutorMessageRole.assistant,
            content: '',
            createdAt: DateTime.fromMillisecondsSinceEpoch(0),
          ),
        )
        .content
        .trim();

    setState(() {
      _isSubmitting = false;
      _transcript = '';
      _questionController.clear();
      if (tutorState.status == TutorUiStatus.error) {
        _voiceError =
            tutorState.errorMessage ?? 'উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।';
      }
    });

    if (_speakReplies &&
        reply.isNotEmpty &&
        tutorState.status != TutorUiStatus.error) {
      setState(() => _isSpeaking = true);
      await _speak(reply);
      if (mounted) setState(() => _isSpeaking = false);
    }

    if (_voiceSessionActive &&
        tutorState.status != TutorUiStatus.error &&
        _speechAvailable) {
      await Future<void>.delayed(const Duration(milliseconds: 350));
      if (mounted && _voiceSessionActive) await _startListening();
    }
  }

  Future<void> _speak(String text) async {
    try {
      String? banglaLanguage;
      for (var attempt = 0; attempt < 4 && banglaLanguage == null; attempt++) {
        final rawLanguages = await _textToSpeech.getLanguages;
        if (rawLanguages is List) {
          for (final rawLanguage in rawLanguages) {
            if (rawLanguage is String &&
                rawLanguage.toLowerCase().startsWith('bn')) {
              banglaLanguage = rawLanguage;
              break;
            }
          }
        }
        if (banglaLanguage == null && attempt < 3) {
          await Future<void>.delayed(const Duration(milliseconds: 250));
        }
      }
      if (banglaLanguage == null) {
        if (mounted) {
          setState(() {
            _voiceError =
                'এই ডিভাইসে বাংলা কণ্ঠস্বর নেই। বাংলা Speech/TTS voice ইনস্টল করে আবার চেষ্টা করো।';
          });
        }
        return;
      }
      await _textToSpeech.setLanguage(banglaLanguage);
      await _textToSpeech.setSpeechRate(0.45);
      await _textToSpeech.awaitSpeakCompletion(true);
      await _textToSpeech.speak(text);
    } catch (_) {
      if (!mounted) return;
      setState(() => _voiceError =
          'উত্তরটি লেখা আকারে আছে, তবে এই ডিভাইসে বাংলা পড়ে শোনানো যাচ্ছে না।');
    }
  }

  @override
  void dispose() {
    _voiceSessionActive = false;
    _speech.stop();
    _textToSpeech.stop();
    _questionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          widget.embedded ? 0 : AppSpacing.lg,
          widget.embedded ? AppSpacing.sm : AppSpacing.md,
          widget.embedded ? 0 : AppSpacing.lg,
          MediaQuery.viewInsetsOf(context).bottom +
              (widget.embedded ? AppSpacing.sm : AppSpacing.lg),
        ),
        child: widget.embedded
            ? _buildVoicePanel(context)
            : SingleChildScrollView(child: _buildVoicePanel(context)),
      ),
    );
  }

  Widget _buildVoicePanel(BuildContext context) {
    final tutorState = ref.watch(tutorControllerProvider);
    final assistantReplies = tutorState.messages
        .where((message) =>
            message.role == TutorMessageRole.assistant &&
            message.content.trim().isNotEmpty)
        .toList(growable: false);
    final latestReply = assistantReplies.isEmpty ? null : assistantReplies.last;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Icon(Icons.record_voice_over_rounded,
                color: AppColors.primary),
            const SizedBox(width: AppSpacing.sm),
            const Expanded(
              child: Text(
                'পাঠ নিয়ে কথা বলো',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 19,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            IconButton(
              tooltip: _speakReplies
                  ? 'উত্তর পড়ে শোনানো বন্ধ'
                  : 'উত্তর পড়ে শোনানো চালু',
              onPressed: () => setState(() => _speakReplies = !_speakReplies),
              visualDensity: VisualDensity.compact,
              icon: Icon(
                _speakReplies
                    ? Icons.volume_up_rounded
                    : Icons.volume_off_rounded,
                color: AppColors.primary,
              ),
            ),
            IconButton(
              tooltip: 'বন্ধ করুন',
              onPressed: widget.onClose ?? () => Navigator.of(context).pop(),
              visualDensity: VisualDensity.compact,
              icon: const Icon(Icons.close_rounded),
            ),
          ],
        ),
        Text(
          [widget.subjectTitle, widget.chapterTitle, widget.lessonTitle]
              .whereType<String>()
              .where((value) => value.trim().isNotEmpty)
              .join(' • '),
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        const SizedBox(height: AppSpacing.lg),
        Container(
          constraints: const BoxConstraints(minHeight: 90, maxHeight: 180),
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: TextField(
            controller: _questionController,
            onChanged: (value) => setState(() => _transcript = value),
            readOnly: _isListening,
            minLines: 3,
            maxLines: 5,
            textInputAction: TextInputAction.newline,
            decoration: InputDecoration(
              border: InputBorder.none,
              hintText: _isListening
                  ? 'শুনছি… প্রশ্নটি বলো'
                  : 'পাঠ নিয়ে বাংলায় প্রশ্ন বলো বা লিখো',
              hintStyle: const TextStyle(color: AppColors.textSecondary),
            ),
          ),
        ),
        if (latestReply != null) ...[
          const SizedBox(height: AppSpacing.md),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('শিক্ষকের উত্তর',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    )),
                const SizedBox(height: AppSpacing.xs),
                Text(latestReply.content, style: const TextStyle(height: 1.5)),
                if (latestReply.citations.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.sm),
                    child: Text(
                      'পাঠ্যবইয়ের ${latestReply.citations.length}টি উৎস',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ),
                Align(
                  alignment: Alignment.centerRight,
                  child: IconButton(
                    tooltip: 'উত্তরটি শুনুন',
                    onPressed: () => _speak(latestReply.content),
                    icon: const Icon(Icons.volume_up_rounded,
                        color: AppColors.primary),
                  ),
                ),
              ],
            ),
          ),
        ],
        if (_voiceError != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(_voiceError!,
              style: const TextStyle(
                color: AppColors.error,
                fontSize: 13,
              )),
        ],
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _speechAvailable && !_isSubmitting
                    ? _toggleListening
                    : null,
                icon: Icon(_isListening || _isSpeaking
                    ? Icons.stop_circle_outlined
                    : Icons.mic_none_rounded),
                label: Text(_isListening
                    ? 'থামাও'
                    : _isSpeaking
                        ? 'কথা থামাও'
                        : 'কথা বলো'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  foregroundColor: AppColors.primary,
                  textStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                  side: BorderSide(
                    color: _isListening
                        ? AppColors.error.withAlpha(150)
                        : AppColors.primary.withAlpha(110),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _transcript.trim().isNotEmpty && !_isSubmitting
                    ? _submitQuestion
                    : null,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 17,
                        height: 17,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
                label: Text(
                  _isSubmitting ? 'অপেক্ষা…' : 'পাঠাও',
                  maxLines: 1,
                  softWrap: false,
                ),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: AppColors.primaryLight,
                  disabledForegroundColor: AppColors.textSecondary,
                  textStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
        if (tutorState.isStreaming)
          const Padding(
            padding: EdgeInsets.only(top: AppSpacing.sm),
            child: Text(
              'এই পাঠের তথ্য দেখে উত্তর তৈরি হচ্ছে…',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
      ],
    );
  }
}
