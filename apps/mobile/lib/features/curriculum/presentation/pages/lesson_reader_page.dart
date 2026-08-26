import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/router/app_routes.dart';
import '../controllers/curriculum_controller.dart';

class LessonReaderPage extends ConsumerStatefulWidget {
  final String? lessonId;

  const LessonReaderPage({super.key, this.lessonId});

  @override
  ConsumerState<LessonReaderPage> createState() => _LessonReaderPageState();
}

class _LessonReaderPageState extends ConsumerState<LessonReaderPage> {
  bool _isBookmarked = false;
  bool _isMarkingComplete = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    if (widget.lessonId == null || widget.lessonId!.trim().isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          title: Text(l10n.lessonReaderTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded,
                color: AppColors.textPrimary),
            onPressed: () => context.go(AppRoutes.learn),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  color: AppColors.error, size: 48),
              const SizedBox(height: AppSpacing.sm),
              const Text('পাঠটি খুঁজে পাওয়া যায়নি', style: AppTypography.body),
              const SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: () => context.go(AppRoutes.learn),
                child: const Text('ফিরে যান'),
              ),
            ],
          ),
        ),
      );
    }

    final asyncData = ref.watch(lessonDetailsProvider(widget.lessonId!));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () {
            final chapterId = asyncData.valueOrNull?.lesson.chapterId;
            if (chapterId != null && chapterId.isNotEmpty) {
              context.go(AppRoutes.chapter(chapterId));
            } else {
              context.go(AppRoutes.learn);
            }
          },
        ),
        title: Text(
          asyncData.valueOrNull?.lesson.title ?? l10n.lessonReaderTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isBookmarked
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_outline_rounded,
              color: AppColors.primary,
            ),
            onPressed: () {
              setState(() => _isBookmarked = !_isBookmarked);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_isBookmarked
                      ? 'পাঠটি বুকমার্ক করা হয়েছে'
                      : 'বুকমার্ক সরানো হয়েছে'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
        ],
      ),
      body: asyncData.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: AppColors.error, size: 48),
                const SizedBox(height: AppSpacing.sm),
                const Text(
                  'পাঠের তথ্য লোড করা যায়নি',
                  textAlign: TextAlign.center,
                  style: AppTypography.body,
                ),
                const SizedBox(height: AppSpacing.md),
                ElevatedButton.icon(
                  onPressed: () =>
                      ref.refresh(lessonDetailsProvider(widget.lessonId!)),
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('পুনরায় চেষ্টা করুন'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        data: (viewData) {
          final lesson = viewData.lesson;
          final chapter = viewData.chapter;
          final subject = viewData.subject;

          final hasTextbookRef = lesson.textbookReference != null &&
              lesson.textbookReference!.isNotEmpty;
          final hasPages = lesson.pageStart != null && lesson.pageEnd != null;

          return SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Metadata Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                '${subject?.name ?? ''} ${chapter != null ? '• ${chapter.title}' : ''}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                            if (hasPages)
                              Text(
                                'পৃষ্ঠা: ${lesson.pageStart}-${lesson.pageEnd}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primary,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          lesson.title,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        if (lesson.summary != null &&
                            lesson.summary!.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Text(
                              lesson.summary!,
                              style: const TextStyle(
                                fontSize: 15,
                                height: 1.6,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.lg),
                        ],
                        if (hasTextbookRef) ...[
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withAlpha(15),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                  color: AppColors.primary.withAlpha(40)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.menu_book_rounded,
                                    color: AppColors.primary),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'এনসিটিবি পাঠ্যবই রেফারেন্স',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                      Text(
                                        lesson.textbookReference!,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: AppSpacing.lg),
                        ],
                        // Ask AI Tutor Card
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
                              const Row(
                                children: [
                                  Icon(Icons.smart_toy_rounded,
                                      color: AppColors.primary, size: 24),
                                  SizedBox(width: AppSpacing.sm),
                                  Text(
                                    'AI শিক্ষকের সাহায্য প্রয়োজন?',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'এই পাঠের যেকোনো প্রশ্ন বা জটিল বিষয় নিয়ে AI টিউটরের সাথে সরাসরি কথা বলো।',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.md),
                              Align(
                                alignment: Alignment.centerRight,
                                child: ElevatedButton.icon(
                                  onPressed: () =>
                                      context.go(AppRoutes.aiTutorChat),
                                  icon: const Icon(Icons.chat_bubble_outline,
                                      size: 18),
                                  label: const Text('প্রশ্ন করো'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Bottom Sticky Completion Action
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md, vertical: 12),
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border: Border(top: BorderSide(color: AppColors.border)),
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _isMarkingComplete
                          ? null
                          : () async {
                              final scaffoldMessenger =
                                  ScaffoldMessenger.of(context);
                              final router = GoRouter.of(context);

                              setState(() => _isMarkingComplete = true);
                              try {
                                await ref
                                    .read(curriculumControllerProvider.notifier)
                                    .markLessonComplete(
                                      lessonId: lesson.id,
                                      timeSpentSeconds: 300,
                                    );
                                scaffoldMessenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('পাঠটি সম্পন্ন হয়েছে!'),
                                    backgroundColor: AppColors.success,
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                                if (chapter != null) {
                                  router.go(AppRoutes.chapter(chapter.id));
                                } else {
                                  router.go(AppRoutes.learn);
                                }
                              } catch (e) {
                                scaffoldMessenger.showSnackBar(
                                  const SnackBar(
                                    content:
                                        Text('প্রগ্রেস সংরক্ষণে সমস্যা হয়েছে'),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              } finally {
                                if (mounted) {
                                  setState(() => _isMarkingComplete = false);
                                }
                              }
                            },
                      icon: _isMarkingComplete
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.check_circle_rounded,
                              color: Colors.white),
                      label: Text(
                        _isMarkingComplete
                            ? 'সংরক্ষণ হচ্ছে...'
                            : 'পাঠ সম্পন্ন করো',
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
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go(AppRoutes.aiTutorChat),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.smart_toy_rounded, color: Colors.white),
      ),
    );
  }
}
