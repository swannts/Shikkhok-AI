// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../controllers/textbook_download_controller.dart';
import '../../domain/entities/download_task.dart';

class OfflineDownloadsPage extends ConsumerStatefulWidget {
  const OfflineDownloadsPage({super.key});

  @override
  ConsumerState<OfflineDownloadsPage> createState() =>
      _OfflineDownloadsPageState();
}

class _OfflineDownloadsPageState extends ConsumerState<OfflineDownloadsPage> {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(offlineTextbooksProvider);
    final notifier = ref.read(offlineTextbooksProvider.notifier);

    final storageMb =
        (state.storageUsedBytes / (1024 * 1024)).toStringAsFixed(1);
    final completedBooks = state.availableTextbooks.where((b) {
      final task = state.activeDownloads[b.id];
      return task != null && task.status == DownloadStatus.completed;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.offlineDownloadsTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => notifier.loadTextbooks(),
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Storage Usage Summary Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.sd_storage_rounded,
                                color: AppColors.primary, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'স্টোরেজ ব্যবহার',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '$storageMb MB ব্যবহৃত',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (state.storageUsedBytes / (500 * 1024 * 1024))
                            .clamp(0.05, 1.0),
                        backgroundColor: AppColors.border,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.primary),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    // 1-Click Batch Download Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: state.isLoading
                            ? null
                            : () => notifier.downloadAllForGrade(),
                        icon: const Icon(Icons.download_for_offline_rounded,
                            color: Colors.white),
                        label: const Text(
                          'শ্রেণীর সকল পাঠ্যবই একসাথে ডাউনলোড করুন',
                          style: TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              Text(
                'সংরক্ষিত বইসমূহ (${completedBooks.length}/${state.availableTextbooks.length}টি ডাউনলোডকৃত)',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              if (state.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (state.availableTextbooks.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Center(
                    child: Text(
                      'কোনো পাঠ্যবই পাওয়া যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.availableTextbooks.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    final book = state.availableTextbooks[index];
                    final task = state.activeDownloads[book.id];
                    final isDownloading =
                        task?.status == DownloadStatus.downloading;
                    final isCompleted =
                        task?.status == DownloadStatus.completed;
                    final sizeLabel = _formatDownloadSize(
                      book.latestManifest?.downloadSizeBytes ??
                          book.fileSizeBytes,
                    );

                    return Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isCompleted
                              ? AppColors.success.withOpacity(0.4)
                              : AppColors.border,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: isCompleted
                                      ? AppColors.success.withOpacity(0.1)
                                      : AppColors.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  isCompleted
                                      ? Icons.check_circle_rounded
                                      : Icons.menu_book_rounded,
                                  color: isCompleted
                                      ? AppColors.success
                                      : AppColors.primary,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      book.title,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        Text(
                                          '$sizeLabel • শ্রেণি ${book.classLevel}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textSecondary,
                                          ),
                                        ),
                                        if (isCompleted &&
                                            (task?.isChecksumVerified ??
                                                true)) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 6, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: AppColors.success
                                                  .withOpacity(0.1),
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                            ),
                                            child: const Text(
                                              'NCTB যাচাইকৃত',
                                              style: TextStyle(
                                                fontSize: 10,
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
                              if (isCompleted) ...[
                                IconButton(
                                  icon: const Icon(Icons.delete_outline_rounded,
                                      color: AppColors.error, size: 20),
                                  onPressed: () => notifier.deleteBook(book.id),
                                  tooltip: 'মুছে ফেলুন',
                                ),
                                IconButton(
                                  icon: const Icon(
                                      Icons.chrome_reader_mode_rounded,
                                      color: AppColors.primary,
                                      size: 22),
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                            'অফলাইনে ${book.title} খোলা হচ্ছে...'),
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  },
                                  tooltip: 'অফলাইনে পড়ুন',
                                ),
                              ] else if (isDownloading) ...[
                                IconButton(
                                  icon: const Icon(Icons.pause_circle_rounded,
                                      color: AppColors.warning, size: 28),
                                  onPressed: () =>
                                      notifier.pauseDownload(book.id),
                                  tooltip: 'স্থগিত করুন',
                                ),
                              ] else ...[
                                IconButton(
                                  icon: const Icon(
                                      Icons.arrow_circle_down_rounded,
                                      color: AppColors.primary,
                                      size: 28),
                                  onPressed: () => notifier.downloadBook(book),
                                  tooltip: 'ডাউনলোড করুন',
                                ),
                              ],
                            ],
                          ),
                          if (isDownloading && task != null) ...[
                            const SizedBox(height: 10),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: task.progress,
                                backgroundColor: AppColors.border,
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                    AppColors.primary),
                                minHeight: 6,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'ডাউনলোড হচ্ছে ${(task.progress * 100).toStringAsFixed(0)}%',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDownloadSize(int? bytes) {
  if (bytes == null || bytes <= 0) {
    return 'অজানা';
  }

  final sizeMb = bytes / (1024 * 1024);
  return '${sizeMb.toStringAsFixed(1)} MB';
}
