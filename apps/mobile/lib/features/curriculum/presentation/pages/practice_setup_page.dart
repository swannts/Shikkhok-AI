import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../practice/domain/entities/practice_question.dart';
import '../../../practice/presentation/controllers/practice_controller.dart';
import '../controllers/curriculum_controller.dart';
import '../../../../features/profile/presentation/controllers/student_profile_controller.dart';
import '../../../../features/profile/domain/entities/student_profile.dart';
import '../../../curriculum/domain/entities/subject.dart';
import '../../../curriculum/domain/entities/chapter.dart';
import '../../../curriculum/domain/entities/lesson.dart';
import '../../../../shared/widgets/student_bottom_navigation.dart';

class PracticeSetupPage extends ConsumerStatefulWidget {
  final String? initialLessonId;

  const PracticeSetupPage({super.key, this.initialLessonId});

  @override
  ConsumerState<PracticeSetupPage> createState() => _PracticeSetupPageState();
}

class _PracticeSetupPageState extends ConsumerState<PracticeSetupPage> {
  int _selectedCount = 10;
  PracticeDifficulty _selectedDifficulty = PracticeDifficulty.medium;
  bool _isLoading = false;
  bool _isLoadingCurriculum = true;
  bool _isLoadingQuestions = false;
  String? _loadError;
  StudentProfile? _profile;
  List<Subject> _subjects = const [];
  List<Chapter> _chapters = const [];
  List<Lesson> _lessons = const [];
  Subject? _selectedSubject;
  Chapter? _selectedChapter;
  Lesson? _selectedLesson;
  List<PracticeQuestion> _availableQuestions = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadCurriculum());
  }

  Future<void> _loadCurriculum() async {
    setState(() {
      _isLoadingCurriculum = true;
      _loadError = null;
    });
    try {
      var profileState = ref.read(studentProfileControllerProvider);
      if (profileState is! StudentProfileLoaded) {
        await ref.read(studentProfileControllerProvider.notifier).loadProfile();
        profileState = ref.read(studentProfileControllerProvider);
      }
      if (profileState is! StudentProfileLoaded) {
        throw StateError(
            'প্রোফাইল পাওয়া যায়নি। আগে শ্রেণি ও মাধ্যম নির্ধারণ করুন।');
      }

      final profile = profileState.profile;
      final subjects =
          await ref.read(curriculumRepositoryProvider).listSubjects(
                classLevel: profile.classLevel,
                medium: profile.medium.toApiString(),
                curriculumYear: profile.curriculumYear,
              );
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _subjects = subjects;
        _isLoadingCurriculum = false;
        if (subjects.isEmpty) {
          _loadError = 'তোমার শ্রেণি ও মাধ্যমে এখনো কোনো বিষয় যুক্ত নেই।';
        }
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoadingCurriculum = false;
        _loadError = error.toString().replaceFirst('Bad state: ', '');
      });
    }
  }

  Future<void> _selectSubject(Subject? subject) async {
    setState(() {
      _selectedSubject = subject;
      _selectedChapter = null;
      _selectedLesson = null;
      _chapters = const [];
      _lessons = const [];
      _availableQuestions = const [];
      _isLoadingQuestions = false;
      _loadError = null;
    });
    if (subject == null) return;
    try {
      final chapters =
          await ref.read(curriculumRepositoryProvider).listChapters(subject.id);
      if (!mounted) return;
      setState(() {
        _chapters = chapters;
        if (chapters.isEmpty) _loadError = 'এই বিষয়ে এখনো কোনো অধ্যায় নেই।';
      });
    } catch (_) {
      if (mounted) {
        setState(() => _loadError = 'অধ্যায় লোড করা যায়নি। আবার চেষ্টা করো।');
      }
    }
  }

  Future<void> _selectChapter(Chapter? chapter) async {
    setState(() {
      _selectedChapter = chapter;
      _selectedLesson = null;
      _lessons = const [];
      _availableQuestions = const [];
      _loadError = null;
    });
    if (chapter == null) return;
    try {
      final lessons =
          await ref.read(curriculumRepositoryProvider).listLessons(chapter.id);
      if (!mounted) return;
      setState(() {
        _lessons = lessons;
        if (lessons.isEmpty) _loadError = 'এই অধ্যায়ে এখনো কোনো পাঠ নেই।';
      });
    } catch (_) {
      if (mounted) {
        setState(() => _loadError = 'পাঠ লোড করা যায়নি। আবার চেষ্টা করো।');
      }
    }
  }

  Future<void> _selectLesson(Lesson? lesson) async {
    setState(() {
      _selectedLesson = lesson;
      _availableQuestions = const [];
      _loadError = null;
      _isLoadingQuestions = lesson != null;
    });
    if (lesson == null) return;
    try {
      final questions =
          await ref.read(practiceRepositoryProvider).listQuestions(
                lessonId: lesson.id,
                limit: 20,
                difficulty: _selectedDifficulty,
              );
      if (!mounted) return;
      setState(() {
        _availableQuestions = questions;
        _isLoadingQuestions = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingQuestions = false;
          _loadError =
              'প্রশ্ন লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করো।';
        });
      }
    }
  }

  Future<void> _refreshQuestionCount() async {
    final lesson = _selectedLesson;
    if (lesson == null) return;
    setState(() => _isLoadingQuestions = true);
    try {
      final questions =
          await ref.read(practiceRepositoryProvider).listQuestions(
                lessonId: lesson.id,
                limit: 20,
                difficulty: _selectedDifficulty,
              );
      if (mounted) {
        setState(() {
          _availableQuestions = questions;
          _isLoadingQuestions = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingQuestions = false;
          _loadError = 'প্রশ্নের তালিকা হালনাগাদ করা যায়নি।';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      bottomNavigationBar: const StudentBottomNavigation(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () =>
              AppRoutes.back(context, fallbackLocation: AppRoutes.learn),
        ),
        title: Text(
          l10n.practiceTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_profile != null) ...[
                      _selectionCard(
                        icon: Icons.school_outlined,
                        label: 'তোমার পাঠ্যক্রম',
                        value:
                            'শ্রেণি ${_profile!.classLevel} • ${_profile!.medium.displayName} • ${_profile!.curriculumYear}',
                      ),
                      const SizedBox(height: AppSpacing.lg),
                    ],
                    if (_isLoadingCurriculum)
                      const Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary))
                    else ...[
                      _buildDropdown<Subject>(
                        label: 'বিষয় বেছে নাও',
                        value: _selectedSubject,
                        items: _subjects,
                        itemLabel: (item) => item.name,
                        onChanged: _selectSubject,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _buildDropdown<Chapter>(
                        label: 'অধ্যায় বেছে নাও',
                        value: _selectedChapter,
                        items: _chapters,
                        itemLabel: (item) => item.title,
                        onChanged:
                            _selectedSubject == null ? null : _selectChapter,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _buildDropdown<Lesson>(
                        label: 'পাঠ বেছে নাও',
                        value: _selectedLesson,
                        items: _lessons,
                        itemLabel: (item) => item.title,
                        onChanged:
                            _selectedChapter == null ? null : _selectLesson,
                      ),
                      if (_loadError != null) ...[
                        const SizedBox(height: AppSpacing.md),
                        _notice(_loadError!, isError: true),
                      ],
                      if (_selectedLesson != null) ...[
                        const SizedBox(height: AppSpacing.md),
                        _notice(
                          _isLoadingQuestions
                              ? 'এই পাঠের আসল প্রশ্নগুলো খোঁজা হচ্ছে…'
                              : _availableQuestions.isEmpty
                                  ? 'এই পাঠে এখনো প্রকাশিত অনুশীলনী প্রশ্ন নেই।'
                                  : 'এই পাঠে ${_availableQuestions.length}টি প্রকাশিত প্রশ্ন পাওয়া গেছে।',
                          isError: false,
                          icon: _isLoadingQuestions
                              ? Icons.sync
                              : Icons.quiz_outlined,
                        ),
                      ],
                      const SizedBox(height: AppSpacing.xl),
                      // Question Count Chips
                      Text(
                        l10n.questionCountLabel,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Row(
                        children: [5, 10, 15, 20].map((cnt) {
                          final isSelected = _selectedCount == cnt;
                          return Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: InkWell(
                                onTap: () =>
                                    setState(() => _selectedCount = cnt),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary.withAlpha(20)
                                        : AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSelected
                                          ? AppColors.primary
                                          : AppColors.border,
                                      width: isSelected ? 2 : 1,
                                    ),
                                  ),
                                  child: Text(
                                    '$cnt',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected
                                          ? AppColors.primary
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      // Difficulty Selector
                      Text(
                        l10n.difficultyLabel,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _buildDifficultyChip(PracticeDifficulty.easy, 'সহজ'),
                          _buildDifficultyChip(
                              PracticeDifficulty.medium, 'মাঝারি'),
                          _buildDifficultyChip(PracticeDifficulty.hard, 'কঠিন'),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      // Practice Information Card
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.info_outline_rounded,
                                    color: AppColors.primary, size: 22),
                                const SizedBox(width: 8),
                                Text(
                                  'অনুশীলন নির্দেশিকা',
                                  style: AppTypography.cardTitle,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'প্রতিটি প্রশ্নের উত্তর দেওয়ার পর সাথে সাথে সঠিক উত্তর এবং বিস্তারিত ব্যাখ্যা দেখতে পাবে। ভুল হলে পরবর্তীতে ভুল পর্যালোচনায় তা পাওয়া যাবে।',
                              style: AppTypography.body,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            // Bottom Sticky Start Action
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isLoading
                      ? null
                      : () async {
                          final lessonId =
                              _selectedLesson?.id ?? widget.initialLessonId;
                          if (lessonId == null ||
                              lessonId == 'lesson_default') {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'অনুশীলন শুরু করতে শিক্ষা বিভাগ থেকে একটি পাঠ নির্বাচন করুন।',
                                ),
                              ),
                            );
                            return;
                          }
                          if (_availableQuestions.isEmpty ||
                              _isLoadingQuestions) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text(
                                      'প্রকাশিত প্রশ্ন ছাড়া অনুশীলন শুরু করা যাবে না।')),
                            );
                            return;
                          }

                          setState(() => _isLoading = true);
                          try {
                            await ref
                                .read(practiceControllerProvider.notifier)
                                .startSession(
                                  lessonId: lessonId,
                                  limit: _selectedCount
                                      .clamp(1, _availableQuestions.length)
                                      .toInt(),
                                  difficulty: _selectedDifficulty,
                                );
                            if (context.mounted) {
                              if (ref.read(practiceControllerProvider)
                                  is PracticeActiveSession) {
                                context.go(AppRoutes.practiceSessionMcq);
                              }
                            }
                          } finally {
                            if (mounted) {
                              setState(() => _isLoading = false);
                            }
                          }
                        },
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.play_arrow_rounded,
                          color: Colors.white, size: 24),
                  label: Text(
                    _isLoading ? 'শুরু হচ্ছে...' : l10n.startPractice,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _selectionCard(
          {required IconData icon,
          required String label,
          required String value}) =>
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.primary.withAlpha(14),
          border: Border.all(color: AppColors.primary.withAlpha(45)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(label, style: AppTypography.caption),
                const SizedBox(height: 3),
                Text(value, style: AppTypography.cardTitle),
              ])),
        ]),
      );

  Widget _buildDropdown<T>({
    required String label,
    required T? value,
    required List<T> items,
    required String Function(T) itemLabel,
    required ValueChanged<T?>? onChanged,
  }) =>
      DropdownButtonFormField<T>(
        initialValue: value,
        isExpanded: true,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: AppColors.surface,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColors.border),
          ),
        ),
        hint: Text(items.isEmpty && onChanged != null
            ? 'কোনো তথ্য পাওয়া যায়নি'
            : 'নির্বাচন করো'),
        items: items
            .map((item) => DropdownMenuItem<T>(
                value: item,
                child: Text(itemLabel(item), overflow: TextOverflow.ellipsis)))
            .toList(),
        onChanged: onChanged,
      );

  Widget _notice(String text,
          {required bool isError, IconData icon = Icons.info_outline}) =>
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isError
              ? AppColors.error.withAlpha(12)
              : AppColors.primary.withAlpha(12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: isError
                  ? AppColors.error.withAlpha(55)
                  : AppColors.primary.withAlpha(45)),
        ),
        child: Row(children: [
          Icon(icon,
              color: isError ? AppColors.error : AppColors.primary, size: 20),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(text, style: AppTypography.body)),
          if (_selectedLesson != null &&
              !_isLoadingQuestions &&
              _availableQuestions.isEmpty &&
              !isError)
            IconButton(
                onPressed: _refreshQuestionCount,
                icon: const Icon(Icons.refresh, color: AppColors.primary),
                tooltip: 'আবার চেষ্টা করো'),
        ]),
      );

  Widget _buildDifficultyChip(PracticeDifficulty difficulty, String label,
      {bool isSpecial = false}) {
    final isSelected = _selectedDifficulty == difficulty;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor:
          isSpecial ? AppColors.primary : AppColors.primary.withAlpha(40),
      backgroundColor: AppColors.surface,
      labelStyle: TextStyle(
        color: isSelected
            ? (isSpecial ? Colors.white : AppColors.primary)
            : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (val) {
        if (val) {
          setState(() => _selectedDifficulty = difficulty);
          _refreshQuestionCount();
        }
      },
    );
  }
}
