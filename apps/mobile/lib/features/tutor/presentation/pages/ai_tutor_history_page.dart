import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../controllers/tutor_controller.dart';

class AiTutorHistoryPage extends ConsumerStatefulWidget {
  const AiTutorHistoryPage({super.key});

  @override
  ConsumerState<AiTutorHistoryPage> createState() => _AiTutorHistoryPageState();
}

class _AiTutorHistoryPageState extends ConsumerState<AiTutorHistoryPage> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tutorControllerProvider.notifier).loadHistory();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatRelative(DateTime? dateTime) {
    if (dateTime == null) {
      return '';
    }
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) {
      return 'এখনই';
    }
    if (diff.inHours < 1) {
      return '${diff.inMinutes} মিনিট আগে';
    }
    if (diff.inDays < 1) {
      return '${diff.inHours} ঘণ্টা আগে';
    }
    return '${diff.inDays} দিন আগে';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(tutorControllerProvider);
    final notifier = ref.read(tutorControllerProvider.notifier);
    final query = _searchController.text.trim().toLowerCase();
    final conversations = state.conversations.where((conversation) {
      if (query.isEmpty) {
        return true;
      }
      return conversation.title.toLowerCase().contains(query) ||
          (conversation.subjectId ?? '').toLowerCase().contains(query) ||
          conversation.curriculumYear.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/ai-tutor-chat'),
        ),
        title: Text(
          l10n.chatHistoryTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline_rounded, color: AppColors.textSecondary),
            onPressed: () => context.go('/ai-tutor-chat'),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: notifier.loadHistory,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: l10n.searchHistoryPlaceholder,
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textSecondary),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              if (state.isLoadingHistory)
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: 4,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) => const AppSkeleton(
                    width: double.infinity,
                    height: 74,
                  ),
                )
              else if (state.errorMessage != null && conversations.isEmpty)
                AppEmptyState(
                  icon: Icons.history_rounded,
                  title: 'ইতিহাস লোড হয়নি',
                  description: state.errorMessage!,
                  actionLabel: 'আবার চেষ্টা করুন',
                  onActionTap: notifier.loadHistory,
                )
              else if (conversations.isEmpty)
                const AppEmptyState(
                  icon: Icons.chat_bubble_outline_rounded,
                  title: 'কোনো আলাপ নেই',
                  description: 'নতুন প্রশ্ন করলে এখানে আপনার কথোপকথন জমা হবে।',
                )
              else
                ...conversations.map(
                  (conversation) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => context.go(
                        '/ai-tutor-chat?conversationId=${Uri.encodeComponent(conversation.id)}',
                      ),
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
                                color: AppColors.primary.withAlpha(18),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.smart_toy_rounded,
                                color: AppColors.primary,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    conversation.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${conversation.classLevel}ম শ্রেণি • ${conversation.messageCount} বার্তা',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  if (_formatRelative(conversation.lastMessageAt).isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      _formatRelative(conversation.lastMessageAt),
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right_rounded,
                              color: AppColors.textSecondary,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
