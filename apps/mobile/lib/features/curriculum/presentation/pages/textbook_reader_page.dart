import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/router/app_routes.dart';

class TextbookReaderPage extends StatefulWidget {
  final String? bookId;

  const TextbookReaderPage({super.key, this.bookId});

  @override
  State<TextbookReaderPage> createState() => _TextbookReaderPageState();
}

class _TextbookReaderPageState extends State<TextbookReaderPage> {
  int _currentPage = 58;
  bool _isBookmarked = false;

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
          onPressed: () => context.go(AppRoutes.textbookLibrary),
        ),
        title: Text(
          'গণিত • পৃষ্ঠা $_currentPage / ২৪০',
          style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isBookmarked
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded,
              color: AppColors.primary,
            ),
            onPressed: () {
              setState(() => _isBookmarked = !_isBookmarked);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_isBookmarked
                      ? 'পৃষ্ঠাটি বুকমার্ক করা হয়েছে'
                      : 'বুকমার্ক সরানো হয়েছে'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(10),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Center(
                        child: Text(
                          'অধ্যায় ৪: সরল সমীকরণ',
                          style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      const Text(
                        '৪.১ সমীকরণের ধারণা',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'আমরা দৈনন্দিন জীবনে বহু গাণিতিক সমস্যার মুখোমুখি হই। যেমন: দুটি সংখ্যার যোগফল ১৫ এবং একটি সংখ্যা ৭ হলে অপর সংখ্যাটি কত? এখানে অজ্ঞাত সংখ্যাটিকে x ধরলে লেখা যায়: x + ৭ = ১৫।',
                        style: TextStyle(
                            fontSize: 15,
                            height: 1.6,
                            color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      // Interactive AI Prompt Box inside book page
                      InkWell(
                        onTap: () => context.go('/ai-tutor-chat'),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withAlpha(15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppColors.primary.withAlpha(40)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.smart_toy_rounded,
                                  color: AppColors.primary, size: 20),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'AI শিক্ষককে বলুন: "x + ৭ = ১৫ সমীকরণটি সহজভাবে বুঝিয়ে দাও"',
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary),
                                ),
                              ),
                              Icon(Icons.arrow_forward_ios_rounded,
                                  color: AppColors.primary, size: 14),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Bottom Page Navigation Bar
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md, vertical: 8),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded,
                        color: AppColors.textPrimary),
                    onPressed: _currentPage > 1
                        ? () => setState(() => _currentPage--)
                        : null,
                  ),
                  Text(
                    'পৃষ্ঠা $_currentPage',
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded,
                        color: AppColors.textPrimary),
                    onPressed: _currentPage < 240
                        ? () => setState(() => _currentPage++)
                        : null,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/ai-tutor-chat'),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.smart_toy_rounded, color: Colors.white),
        label: const Text('AI শিক্ষক',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
      ),
    );
  }
}
