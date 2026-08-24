import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class TextbookLibraryPage extends StatefulWidget {
  const TextbookLibraryPage({super.key});

  @override
  State<TextbookLibraryPage> createState() => _TextbookLibraryPageState();
}

class _TextbookLibraryPageState extends State<TextbookLibraryPage> {
  int _selectedClassIndex = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final classTabs = ['৮ম শ্রেণি', '৯ম-১০ম শ্রেণি', '১১দশ-১২দশ শ্রেণি'];
    final textbooks = [
      (
        'গণিত (NCTB 2026)',
        '৪৮ MB',
        Icons.calculate_rounded,
        AppColors.primary,
        true
      ),
      (
        'বিজ্ঞান (NCTB 2026)',
        '৪৫ MB',
        Icons.science_rounded,
        Colors.green,
        false
      ),
      (
        'English for Today',
        '৩২ MB',
        Icons.language_rounded,
        Colors.orange,
        false
      ),
      ('বাংলা সাহিত্য', '২৮ MB', Icons.menu_book_rounded, Colors.teal, false),
    ];

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
          l10n.textbookLibraryTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Class Tabs
            Container(
              color: AppColors.surface,
              child: Row(
                children: List.generate(classTabs.length, (index) {
                  final isSelected = _selectedClassIndex == index;
                  return Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedClassIndex = index),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.transparent,
                              width: 3,
                            ),
                          ),
                        ),
                        child: Text(
                          classTabs[index],
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.textSecondary,
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
              child: GridView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.85,
                ),
                itemCount: textbooks.length,
                itemBuilder: (context, index) {
                  final book = textbooks[index];
                  return InkWell(
                    onTap: () => context.go('/textbook-reader'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: book.$4.withAlpha(20),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(book.$3, color: book.$4, size: 28),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(book.$1,
                                  style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary)),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(book.$2,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary)),
                                  Icon(
                                    book.$5
                                        ? Icons.check_circle_rounded
                                        : Icons.file_download_outlined,
                                    color: book.$5
                                        ? Colors.green
                                        : AppColors.primary,
                                    size: 20,
                                  ),
                                ],
                              ),
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
