import 'dart:async';
import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../domain/entities/tutor_message.dart';
import '../controllers/tutor_controller.dart';
import '../state/tutor_state.dart';
import '../voice_reply_chunker.dart';
import '../voice_speech_locale.dart';

class LessonVoiceTutorSheet extends ConsumerStatefulWidget {
  final String lessonTitle;
  final String? chapterTitle;
  final String? subjectTitle;
  final bool embedded;
  final bool voiceOnly;
  final bool speakOpeningMessageOnStart;
  final bool autoStartVoice;
  final bool headless;
  final VoidCallback? onClose;
  final ValueChanged<String>? onVoiceError;
  final Future<bool> Function()? onPrepareConversation;

  const LessonVoiceTutorSheet({
    super.key,
    required this.lessonTitle,
    this.chapterTitle,
    this.subjectTitle,
    this.embedded = false,
    this.voiceOnly = false,
    this.speakOpeningMessageOnStart = false,
    this.autoStartVoice = false,
    this.headless = false,
    this.onClose,
    this.onVoiceError,
    this.onPrepareConversation,
  });

  @override
  ConsumerState<LessonVoiceTutorSheet> createState() =>
      _LessonVoiceTutorSheetState();
}

class _LessonVoiceTutorSheetState extends ConsumerState<LessonVoiceTutorSheet> {
  final SpeechToText _speech = SpeechToText();
  final FlutterTts _textToSpeech = FlutterTts();
  final TextEditingController _questionController = TextEditingController();
  final Queue<String> _speechQueue = Queue<String>();
  final VoiceReplyChunker _replyChunker = VoiceReplyChunker();
  late final Future<void> _speechInitialization;
  ProviderSubscription<TutorState>? _tutorSubscription;
  bool _speechAvailable = false;
  bool _isListening = false;
  bool _isStartingListening = false;
  bool _isSubmitting = false;
  bool _isPreparingConversation = false;
  bool _openingTutorTurnSpoken = false;
  bool _voiceSessionActive = false;
  bool _isSpeaking = false;
  bool _isProcessingSpeechQueue = false;
  bool _tutorWasStreaming = false;
  bool _responseComplete = false;
  bool _speakReplies = true;
  String? _speechLocale;
  String _transcript = '';
  String _observedAssistantText = '';
  String? _voiceError;
  int _voiceTurnId = 0;
  int _speechPlaybackEpoch = 0;

  @override
  void initState() {
    super.initState();
    _tutorSubscription = ref.listenManual(
      tutorControllerProvider,
      _onTutorStateChanged,
    );
    _speechInitialization = _initializeSpeech();
    if (widget.autoStartVoice) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        unawaited(_startVoiceOnOpen());
      });
    }
  }

  Future<void> _startVoiceOnOpen() async {
    await _speechInitialization;
    if (mounted && !_voiceSessionActive && !_isListening) {
      await _toggleListening();
    }
  }

  void _reportVoiceError(String message) {
    if (!mounted) return;
    setState(() => _voiceError = message);
    if (widget.headless) widget.onVoiceError?.call(message);
  }

  void _onTutorStateChanged(TutorState? previous, TutorState next) {
    if (!mounted) return;

    final assistantMessages = next.messages
        .where((message) => message.role == TutorMessageRole.assistant);
    final latestText =
        assistantMessages.isEmpty ? '' : assistantMessages.last.content;

    if (next.isStreaming) {
      if (!_tutorWasStreaming) {
        _replyChunker.reset();
        _observedAssistantText = '';
        _responseComplete = false;
      }
      _tutorWasStreaming = true;
      final delta = latestText.startsWith(_observedAssistantText)
          ? latestText.substring(_observedAssistantText.length)
          : latestText;
      _observedAssistantText = latestText;

      if (_speakReplies && delta.isNotEmpty) {
        _speechQueue.addAll(_replyChunker.add(delta));
        unawaited(_playSpeechQueue());
      }
      return;
    }

    if (_tutorWasStreaming) {
      _tutorWasStreaming = false;
      _responseComplete = true;
      if (_speakReplies &&
          next.status != TutorUiStatus.error &&
          next.status != TutorUiStatus.cancelled) {
        final remainingText = _replyChunker.flush();
        if (remainingText.isNotEmpty) _speechQueue.addLast(remainingText);
        unawaited(_playSpeechQueue());
      } else {
        _replyChunker.reset();
      }
      unawaited(_maybeResumeVoiceInput());
    }
  }

  Future<void> _initializeSpeech() async {
    try {
      final available = await _speech.initialize(
        onError: (error) {
          if (!mounted) return;
          setState(() {
            _isListening = false;
            _isStartingListening = false;
          });
          _reportVoiceError(_speechErrorMessage(error.errorMsg));
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
        localeId = selectBengaliSpeechLocale(
          locales.map((locale) => locale.localeId),
          isWeb: kIsWeb,
        );
      }
      final insecurePhoneWebOrigin = _isInsecurePhoneWebOrigin;
      setState(() {
        _speechAvailable =
            available && localeId != null && !insecurePhoneWebOrigin;
        _speechLocale = localeId;
        if (insecurePhoneWebOrigin) {
          _voiceError =
              'ফোনে এই HTTP ঠিকানায় ব্রাউজার মাইক্রোফোন চালাতে দেয় না। ভয়েস ব্যবহারে HTTPS লিংক বা Android অ্যাপ ব্যবহার করুন।';
        } else if (!available || localeId == null) {
          _voiceError =
              'বাংলা ভয়েস চালু করা যাচ্ছে না। মাইক্রোফোনের অনুমতি দিন এবং ফোনের Speech Services-এ বাংলা ভাষা চালু করে আবার চেষ্টা করুন।';
        }
      });
      if (widget.headless && _voiceError != null) {
        widget.onVoiceError?.call(_voiceError!);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _speechAvailable = false;
      });
      _reportVoiceError(
        'মাইক্রোফোন চালু করা যায়নি। অ্যাপের মাইক্রোফোন অনুমতি চালু করে আবার চেষ্টা করো।',
      );
    }
  }

  bool get _isInsecurePhoneWebOrigin {
    if (!kIsWeb || Uri.base.scheme == 'https') return false;
    final host = Uri.base.host.toLowerCase();
    return host != 'localhost' && host != '127.0.0.1' && host != '::1';
  }

  String _speechErrorMessage(String errorCode) {
    final code = errorCode.toLowerCase();
    if (kIsWeb &&
        _isInsecurePhoneWebOrigin &&
        (code.contains('not-allowed') ||
            code.contains('service-not-allowed'))) {
      return 'ব্রাউজার এই HTTP ঠিকানায় মাইক্রোফোন অনুমতি দেয় না। HTTPS লিংক বা Android অ্যাপ ব্যবহার করুন।';
    }
    if (code.contains('language') || code.contains('lang')) {
      return 'বাংলা কথা শনাক্ত হচ্ছে না। ফোনের Speech Services-এ বাংলা ভাষা চালু করে আবার চেষ্টা করুন।';
    }
    if (code.contains('not-allowed') || code.contains('permission')) {
      return 'মাইক্রোফোন অনুমতি বন্ধ আছে। ব্রাউজার/অ্যাপ সেটিংসে Microphone অনুমতি দিন।';
    }
    return 'কথা শোনা যায়নি। মাইক্রোফোনের অনুমতি দিয়ে আবার চেষ্টা করুন।';
  }

  Future<void> _toggleListening() async {
    if (_isListening) {
      _voiceSessionActive = false;
      await _speech.stop();
      if (mounted) setState(() => _isListening = false);
      return;
    }

    final tutorState = ref.read(tutorControllerProvider);
    if (_isSpeaking || _isSubmitting || tutorState.isStreaming) {
      // Tapping the mic while the tutor responds interrupts playback and
      // generation, then immediately opens the mic for a spoken follow-up.
      _voiceSessionActive = true;
      _voiceTurnId++;
      _isSubmitting = false;
      _responseComplete = false;
      _speechPlaybackEpoch++;
      _speechQueue.clear();
      _replyChunker.reset();
      ref.read(tutorControllerProvider.notifier).stopGeneration();
      await _textToSpeech.stop();
      if (mounted) {
        setState(() {
          _isSpeaking = false;
          _isSubmitting = false;
        });
      }
      await _startListening();
      return;
    }

    if (_voiceSessionActive) {
      _voiceSessionActive = false;
      if (mounted) setState(() {});
      return;
    }
    if (!_speechAvailable || _speechLocale == null) {
      _reportVoiceError('এই ব্রাউজার বা ডিভাইসে ভয়েস ইনপুট পাওয়া যাচ্ছে না।');
      return;
    }

    if (!await _ensureConversation()) return;

    await _textToSpeech.stop();
    _voiceSessionActive = true;
    await _startListening();
  }

  Future<bool> _ensureConversation() async {
    final prepare = widget.onPrepareConversation;
    if (prepare != null) {
      if (_isPreparingConversation) return false;
      setState(() => _isPreparingConversation = true);
      try {
        if (!await prepare()) return false;
      } catch (_) {
        if (mounted) {
          _reportVoiceError('AI শিক্ষকের সাথে সংযোগ করা যায়নি।');
        }
        return false;
      } finally {
        if (mounted) setState(() => _isPreparingConversation = false);
      }
    }

    if (widget.voiceOnly &&
        widget.speakOpeningMessageOnStart &&
        !_openingTutorTurnSpoken) {
      _openingTutorTurnSpoken = true;
      final assistantMessages = ref
          .read(tutorControllerProvider)
          .messages
          .where((message) => message.role == TutorMessageRole.assistant);
      final openingReply =
          assistantMessages.isEmpty ? null : assistantMessages.last.content;
      if (openingReply != null && openingReply.trim().isNotEmpty) {
        if (mounted) setState(() => _isSpeaking = true);
        await _speak(openingReply);
        if (mounted) setState(() => _isSpeaking = false);
      }
    }
    return true;
  }

  Future<void> _startListening() async {
    if (!_voiceSessionActive ||
        !_speechAvailable ||
        _isSubmitting ||
        _isListening ||
        _isStartingListening) {
      return;
    }
    _isStartingListening = true;
    setState(() {
      _transcript = '';
      _voiceError = null;
      _isListening = true;
    });
    try {
      final startedListening = await _speech.listen(
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
      if (!startedListening) {
        throw StateError('Speech recognition could not start');
      }
      _isStartingListening = false;
    } catch (_) {
      _isStartingListening = false;
      if (!mounted) return;
      setState(() {
        _isListening = false;
        _voiceSessionActive = false;
      });
      _reportVoiceError(_isInsecurePhoneWebOrigin
          ? 'ফোনে এই HTTP ঠিকানায় ব্রাউজার মাইক্রোফোন চালাতে দেয় না। ভয়েস ব্যবহারে HTTPS লিংক বা Android অ্যাপ ব্যবহার করুন।'
          : 'মাইক্রোফোন চালু করা যায়নি। অনুমতি পরীক্ষা করে আবার চেষ্টা করুন।');
    }
  }

  void _onSpeechResult(SpeechRecognitionResult result) {
    if (!mounted) return;
    final transcript = result.recognizedWords.trim();
    if (!widget.voiceOnly) {
      _questionController.value = TextEditingValue(
        text: transcript,
        selection: TextSelection.collapsed(offset: transcript.length),
      );
    }
    setState(() => _transcript = transcript);
    if (result.finalResult && _voiceSessionActive && transcript.isNotEmpty) {
      unawaited(_submitQuestion());
    }
  }

  Future<void> _submitQuestion() async {
    final question = _transcript.trim();
    if (question.isEmpty || _isSubmitting) return;
    if (!await _ensureConversation()) return;
    final turnId = ++_voiceTurnId;
    setState(() {
      _isSubmitting = true;
      _voiceError = null;
    });
    if (_isListening) {
      await _speech.stop();
    }
    if (!mounted) return;
    setState(() => _isListening = false);

    _replyChunker.reset();
    _observedAssistantText = '';
    _responseComplete = false;
    await ref.read(tutorControllerProvider.notifier).streamMessage(question);
    if (!mounted || turnId != _voiceTurnId) return;

    final tutorState = ref.read(tutorControllerProvider);

    setState(() {
      _isSubmitting = false;
      _transcript = '';
      if (!widget.voiceOnly) _questionController.clear();
      if (tutorState.status == TutorUiStatus.error) {
        _voiceError =
            tutorState.errorMessage ?? 'উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।';
      }
    });
    if (tutorState.status == TutorUiStatus.error && _voiceError != null) {
      if (widget.headless) widget.onVoiceError?.call(_voiceError!);
    }
    unawaited(_maybeResumeVoiceInput());
  }

  Future<void> _playSpeechQueue() async {
    if (_isProcessingSpeechQueue || !_speakReplies) return;
    _isProcessingSpeechQueue = true;
    final playbackEpoch = _speechPlaybackEpoch;
    try {
      while (_speechQueue.isNotEmpty &&
          mounted &&
          playbackEpoch == _speechPlaybackEpoch) {
        final sentence = _speechQueue.removeFirst();
        setState(() => _isSpeaking = true);
        await _speak(sentence);
      }
    } finally {
      _isProcessingSpeechQueue = false;
      if (mounted && playbackEpoch == _speechPlaybackEpoch) {
        setState(() => _isSpeaking = false);
        unawaited(_maybeResumeVoiceInput());
      }
    }
  }

  Future<void> _maybeResumeVoiceInput() async {
    if (!mounted ||
        !_voiceSessionActive ||
        !_responseComplete ||
        _isSubmitting ||
        _isSpeaking ||
        _isProcessingSpeechQueue ||
        _speechQueue.isNotEmpty ||
        !_speechAvailable) {
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (mounted &&
        _voiceSessionActive &&
        !_isSubmitting &&
        !_isListening &&
        !_isStartingListening) {
      await _startListening();
    }
  }

  Future<void> _toggleSpeechOutput() async {
    final enabled = !_speakReplies;
    setState(() => _speakReplies = enabled);
    if (!enabled) {
      _speechPlaybackEpoch++;
      _speechQueue.clear();
      _replyChunker.reset();
      await _textToSpeech.stop();
      if (mounted) setState(() => _isSpeaking = false);
      unawaited(_maybeResumeVoiceInput());
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
          _reportVoiceError(
            'এই ডিভাইসে বাংলা কণ্ঠস্বর নেই। বাংলা Speech/TTS voice ইনস্টল করে আবার চেষ্টা করো।',
          );
        }
        return;
      }
      await _textToSpeech.setLanguage(banglaLanguage);
      await _textToSpeech.setSpeechRate(0.45);
      await _textToSpeech.awaitSpeakCompletion(true);
      await _textToSpeech.speak(text);
    } catch (_) {
      _reportVoiceError(
        'উত্তরটি লেখা আকারে আছে, তবে এই ডিভাইসে বাংলা পড়ে শোনানো যাচ্ছে না।',
      );
    }
  }

  @override
  void dispose() {
    if (widget.headless &&
        (_voiceSessionActive ||
            _isPreparingConversation ||
            _tutorWasStreaming)) {
      ref.read(tutorControllerProvider.notifier).stopGeneration();
    }
    _voiceSessionActive = false;
    _tutorSubscription?.close();
    _speech.stop();
    _textToSpeech.stop();
    _questionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.headless) return const SizedBox.shrink();
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
              onPressed: _toggleSpeechOutput,
              visualDensity: VisualDensity.compact,
              icon: Icon(
                _speakReplies
                    ? Icons.volume_up_rounded
                    : Icons.volume_off_rounded,
                color: AppColors.primary,
              ),
            ),
            if (!widget.embedded)
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
        if (widget.voiceOnly) ...[
          const SizedBox(height: AppSpacing.xs),
          const Text(
            'শুনে শেখো, মাইকে মুখে উত্তর দাও',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        if (!widget.voiceOnly)
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
        if (_voiceSessionActive || _isListening || _isSpeaking) ...[
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md, vertical: AppSpacing.sm),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  _isListening
                      ? Icons.mic_rounded
                      : _isSpeaking
                          ? Icons.volume_up_rounded
                          : Icons.autorenew_rounded,
                  size: 18,
                  color: AppColors.primary,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    _isListening
                        ? 'শুনছি—কথা শেষ হলে উত্তর দেব'
                        : _isSpeaking
                            ? 'উত্তর বলছি—মাইক্রোফোন চাপলে থামিয়ে বলো'
                            : _isSubmitting
                                ? 'উত্তর তৈরি হচ্ছে—মাইক্রোফোন চাপলে থামিয়ে বলো'
                                : 'ভয়েস কথোপকথন চালু—এখন কথা বলো',
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
        if (latestReply != null && !widget.voiceOnly) ...[
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
        if (widget.voiceOnly)
          SizedBox(
            height: 54,
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _speechAvailable && !_isPreparingConversation
                  ? _toggleListening
                  : null,
              icon: _isPreparingConversation
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(_isListening || _isSpeaking
                      ? Icons.stop_circle_outlined
                      : Icons.mic_rounded),
              label: Text(
                _isListening
                    ? 'শোনা বন্ধ করো'
                    : _isSpeaking || _isSubmitting
                        ? 'থামিয়ে কথা বলো'
                        : _isPreparingConversation
                            ? 'সংযোগ হচ্ছে…'
                            : _voiceSessionActive
                                ? 'কথোপকথন বন্ধ করো'
                                : 'শেখা শুরু করো',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    _isListening ? AppColors.error : AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.primaryLight,
                disabledForegroundColor: AppColors.textSecondary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          )
        else
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _speechAvailable && !_isPreparingConversation
                      ? _toggleListening
                      : null,
                  icon: Icon(_isListening || _isSpeaking
                      ? Icons.stop_circle_outlined
                      : Icons.mic_none_rounded),
                  label: Text(_isListening
                      ? 'কথোপকথন থামাও'
                      : _isSpeaking || _isSubmitting
                          ? 'থামিয়ে বলো'
                          : _isPreparingConversation
                              ? 'সংযোগ হচ্ছে…'
                              : _voiceSessionActive
                                  ? 'ভয়েস বন্ধ করো'
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
