import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../controllers/textbook_download_controller.dart';
import '../../domain/entities/download_task.dart';

class TextbookLibraryPage extends ConsumerStatefulWidget {
  const TextbookLibraryPage({super.key});

  @override
  ConsumerState<TextbookLibraryPage> createState() => _TextbookLibraryPageState();
}

class _TextbookLibraryPageState extends ConsumerState<TextbookLibraryPage> {
  int _selectedClassIndex = 2; // Default to Class 8

  final List<(int, String)> _grades = [
    (6, '৬ষ্ঠ শ্রেণি'),
    (7, '৭ম শ্রেণি'),
    (8, '৮ম শ্রেণি'),
    (9, '৯ম-১০ম শ্রেণি'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrentGrade();
    });
  }

  void _loadCurrentGrade() {
    final grade = _grades[_selectedClassIndex].$1;
    ref.read(offlineTextbooksProvider.notifier).loadTextbooks(classLevel: grade);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(offlineTextbooksProvider);
    final notifier = ref.read(offlineTextbooksProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.textbookLibraryTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.offline_pin_rounded, color: AppColors.primary),
            onPressed: () => context.push('/offline-downloads'),
            tooltip: 'অফলাইন ডাউনলোড সমূহ',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Class Tabs
            Container(
              color: AppColors.surface,
              child: Row(
                children: List.generate(_grades.length, (index) {
                  final isSelected = _selectedClassIndex == index;
                  final grade = _grades[index];
                  return Expanded(
                    child: InkWell(
                      onTap: () {
                        setState(() => _selectedClassIndex = index);
                        notifier.loadTextbooks(classLevel: grade.$1);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: isSelected ? AppColors.primary : Colors.transparent,
                              width: 3,
                            ),
                          ),
                        ),
                        child: Text(
                          grade.$2,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? AppColors.primary : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const Divider(height: 1, color: AppColors.border),

            // Books Grid
            Expanded(
              child: state.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : state.availableTextbooks.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.menu_book_rounded, size: 48, color: AppColors.textSecondary),
                              const SizedBox(height: 12),
                              const Text('এই শ্রেণির কোনো পাঠ্যবই পাওয়া যায়নি'),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: _loadCurrentGrade,
                                child: const Text('পুনরায় চেষ্টা করুন'),
                              ),
                            ],
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.82,
                          ),
                          itemCount: state.availableTextbooks.length,
                          itemBuilder: (context, index) {
                            final book = state.availableTextbooks[index];
                            final task = state.activeDownloads[book.id];
                            final isCompleted = task?.status == DownloadStatus.completed;
                            final isDownloading = task?.status == DownloadStatus.downloading;

                            final sizeMb = ((book.latestManifest?.downloadSizeBytes ??
                                        book.fileSizeBytes ??
                                        15728640) /
                                    (1024 * 1024))
                                .toStringAsFixed(1);

                            return InkWell(
                              onTap: () {
                                if (isCompleted) {
                                  context.push('/textbook-reader');
                                } else if (!isDownloading) {
                                  notifier.downloadBook(book);
                                }
                              },
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: const EdgeInsets.all(AppSpacing.md),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isCompleted
                                        ? AppColors.success.withValues(alpha: 0.4)
                                        : AppColors.border,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: isCompleted
                                            ? AppColors.success.withValues(alpha: 0.1)
                                            : AppColors.primary.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: Icon(
                                        isCompleted
                                            ? Icons.check_circle_rounded
                                            : Icons.menu_book_rounded,
                                        color: isCompleted ? AppColors.success : AppColors.primary,
                                        size: 26,
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          book.title,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              '$sizeMb MB',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                            if (isDownloading)
                                              const SizedBox(
                                                width: 16,
                                                height: 16,
                                                child: CircularProgressIndicator(strokeWidth: 2),
                                              )
                                            else
                                              Icon(
                                                isCompleted
                                                    ? Icons.offline_pin_rounded
                                                    : Icons.file_download_outlined,
                                                color: isCompleted ? AppColors.success : AppColors.primary,
                                                size: 20,
                                              ),
                                          ],
                                        ),
                                        if (isCompleted && (task?.isChecksumVerified ?? true)) ...[
                                          const SizedBox(height: 4),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: AppColors.success.withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text(
                                              'NCTB SHA-256',
                                              style: TextStyle(
                                                fontSize: 9,
                                                color: AppColors.success,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
