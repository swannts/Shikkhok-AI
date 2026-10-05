import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../controllers/curriculum_controller.dart';
import '../widgets/cache_status_banner.dart';
import '../../domain/entities/subject.dart';

class SubjectDetailsPage extends ConsumerWidget {
  final String? subjectId;

  const SubjectDetailsPage({super.key, this.subjectId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (subjectId == null || subjectId!.trim().isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          title: const Text('বিষয় বিবরণী'),
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
              const Text('বিষয়টি খুঁজে পাওয়া যায়নি', style: AppTypography.body),
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

    final asyncData = ref.watch(subjectDetailsProvider(subjectId!));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.learn),
        ),
        title: Text(
          asyncData.valueOrNull?.subject.name ?? 'বিষয় বিবরণী',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
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
                  'অধ্যায় তালিকা আনা সম্ভব হয়নি',
                  textAlign: TextAlign.center,
                  style: AppTypography.body,
                ),
                const SizedBox(height: AppSpacing.md),
                ElevatedButton.icon(
                  onPressed: () =>
                      ref.refresh(subjectDetailsProvider(subjectId!)),
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
          final subject = viewData.subject;
          final readingList = viewData.chapters
              .where((chapter) => chapter.slug == 'bn3-reading-list')
              .firstOrNull;
          // Do not present the old OCR placeholder as an NCTB chapter.
          final chapters = viewData.chapters.where((chapter) {
            final normalizedTitle = chapter.title.trim().toLowerCase();
            return chapter.slug != 'pathsomuh' &&
                chapter.slug != 'bn3-reading-list' &&
                normalizedTitle != 'পাঠসমূহ';
          }).toList();

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CacheStatusBanner(
                      cacheKey: 'subject:$subjectId', entityType: 'subject'),
                  // Hero Subject Banner
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(24),
                      border:
                          Border.all(color: AppColors.primary.withAlpha(40)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.menu_book_rounded,
                              color: Colors.white, size: 32),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                subject.name,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                'শ্রেণি ${subject.classLevel} • ${subject.medium.toUpperCase()}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                readingList == null
                                    ? '${chapters.length}টি অধ্যায়'
                                    : 'বইয়ের পাঠসমূহ',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _TextbookReadAction(subject: subject),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    readingList == null ? 'অধ্যায়সমূহ' : 'পাঠসমূহ',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  if (readingList != null) ...[
                    _BanglaReadingUnitList(chapterId: readingList.id),
                  ] else if (chapters.isEmpty) ...[
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.folder_open_rounded,
                                color: AppColors.textSecondary, size: 48),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              'এই বইয়ের নির্ভরযোগ্য অধ্যায় তালিকা এখনো প্রস্তুত নয়। মূল বই পড়তে উপরের PDF বোতামটি ব্যবহার করো।',
                              style: AppTypography.body
                                  .copyWith(color: AppColors.textSecondary),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: chapters.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final ch = chapters[index];
                        return InkWell(
                          onTap: () => context.go(AppRoutes.chapter(ch.id)),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withAlpha(20),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.play_arrow_rounded,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'অধ্যায় ${ch.order > 0 ? ch.order : index + 1}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                      Text(
                                        ch.title,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      if (ch.estimatedMinutes != null ||
                                          ch.summary != null) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          ch.estimatedMinutes != null
                                              ? '${ch.estimatedMinutes} মিনিট'
                                              : (ch.summary ?? ''),
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                const Icon(Icons.chevron_right_rounded,
                                    color: AppColors.textSecondary),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _TextbookReadAction extends ConsumerWidget {
  final Subject subject;

  const _TextbookReadAction({required this.subject});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textbooks = ref.watch(textbooksForSubjectProvider(subject));
    return textbooks.when(
      loading: () => const LinearProgressIndicator(
        color: AppColors.primary,
        minHeight: 2,
      ),
      error: (error, stackTrace) => const SizedBox.shrink(),
      data: (books) {
        if (books.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: const Text(
              'এই বইয়ের PDF এখনো পাওয়া যায়নি। নিচের অধ্যায়গুলো থেকে পড়া চালিয়ে যাও।',
              style: AppTypography.caption,
              textAlign: TextAlign.center,
            ),
          );
        }
        final book = books.first;
        return SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () => context.push(AppRoutes.textbook(book.id)),
            icon: const Icon(Icons.chrome_reader_mode_rounded),
            label: const Text('সম্পূর্ণ পাঠ্যবই পড়ো'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.primary),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _BanglaReadingUnitList extends ConsumerWidget {
  final String chapterId;

  const _BanglaReadingUnitList({required this.chapterId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lessons = ref.watch(chapterLessonsProvider(chapterId));
    return lessons.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      ),
      error: (error, stackTrace) => const Text(
        'পাঠগুলো লোড করা যায়নি। আবার চেষ্টা করো।',
        style: AppTypography.body,
      ),
      data: (items) {
        if (items.isEmpty) {
          return const Text('এই বইয়ে এখনো কোনো পাঠ যোগ করা হয়নি।');
        }
        return ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          separatorBuilder: (context, index) =>
              const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, index) {
            final lesson = items[index];
            return InkWell(
              onTap: () => context.go(AppRoutes.lesson(lesson.id)),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                constraints: const BoxConstraints(minHeight: 68),
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(20),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${lesson.order}',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(lesson.title, style: AppTypography.cardTitle),
                          if (lesson.pageStart != null) ...[
                            const SizedBox(height: 3),
                            Text(
                              lesson.pageEnd == lesson.pageStart
                                  ? 'মুদ্রিত পৃষ্ঠা ${lesson.pageStart}'
                                  : 'মুদ্রিত পৃষ্ঠা ${lesson.pageStart}–${lesson.pageEnd}',
                              style: AppTypography.caption,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded,
                        color: AppColors.textSecondary),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
