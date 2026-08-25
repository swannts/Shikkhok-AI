import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../../domain/entities/tutor_message.dart';
import '../controllers/tutor_controller.dart';

class AiTutorChatPage extends ConsumerStatefulWidget {
  const AiTutorChatPage({
    super.key,
    this.initialConversationId,
  });

  final String? initialConversationId;

  @override
  ConsumerState<AiTutorChatPage> createState() => _AiTutorChatPageState();
}

class _AiTutorChatPageState extends ConsumerState<AiTutorChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  int _lastMessageCount = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(tutorControllerProvider.notifier)
          .loadInitial(conversationId: widget.initialConversationId);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) {
      return;
    }

    _messageController.clear();
    await ref.read(tutorControllerProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) {
        return;
      }
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(tutorControllerProvider);
    final notifier = ref.read(tutorControllerProvider.notifier);
    final activeConversation = state.activeConversation;

    if (_lastMessageCount != state.messages.length &&
        state.messages.isNotEmpty) {
      _lastMessageCount = state.messages.length;
      _scrollToBottom();
    }

    final subtitle = activeConversation == null
        ? 'নতুন আলাপ'
        : '${activeConversation.classLevel}ম শ্রেণি • ${activeConversation.medium ?? 'বাংলা'}';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/home'),
        ),
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primary.withAlpha(20),
                  child: const Icon(
                    Icons.school_rounded,
                    color: AppColors.primary,
                    size: 22,
                  ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activeConversation?.title ?? l10n.aiTutorTitle,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded,
                color: AppColors.textSecondary),
            onPressed: () => context.go('/ai-tutor-history'),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: 8,
              ),
              color: AppColors.surface,
              child: Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(16),
                      border:
                          Border.all(color: AppColors.primary.withAlpha(40)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome_rounded,
                            size: 14, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          activeConversation?.title ?? 'AI Tutor',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            Expanded(
              child: Builder(
                builder: (context) {
                  if (state.isLoading && state.messages.isEmpty) {
                    return ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(AppSpacing.md),
                      itemCount: 5,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) => Align(
                        alignment: index.isEven
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: const AppCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              AppSkeleton(width: 160, height: 14),
                              SizedBox(height: 10),
                              AppSkeleton(width: 220, height: 12),
                              SizedBox(height: 8),
                              AppSkeleton(width: 120, height: 12),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  if (state.errorMessage != null && state.messages.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        AppEmptyState(
                          icon: Icons.smart_toy_rounded,
                          title: 'AI টিউটর লোড হয়নি',
                          description: state.errorMessage!,
                          actionLabel: 'আবার চেষ্টা করুন',
                          onActionTap: () => notifier.loadInitial(
                              conversationId: widget.initialConversationId),
                        ),
                      ],
                    );
                  }

                  if (state.messages.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        AppEmptyState(
                          icon: Icons.chat_bubble_outline_rounded,
                          title: 'এখনও কোনো আলাপ নেই',
                          description:
                              'একটি প্রশ্ন লিখুন, আমি ধাপে ধাপে ব্যাখ্যা শুরু করব।',
                        ),
                      ],
                    );
                  }

                  return ListView.builder(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    itemCount:
                        state.messages.length + (state.isSending ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= state.messages.length) {
                        return const Padding(
                          padding: EdgeInsets.only(top: 8),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: AppCard(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  ),
                                  SizedBox(width: 10),
                                  Text(
                                    'AI উত্তর লিখছে...',
                                    style: TextStyle(
                                        color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }

                      final message = state.messages[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _ChatBubble(message: message),
                      );
                    },
                  );
                },
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.md,
                AppSpacing.md,
              ),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 42,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildQuickChip('2x + 5 = 15'),
                        _buildQuickChip(l10n.hintOption),
                        _buildQuickChip(l10n.dontUnderstandOption),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          minLines: 1,
                          maxLines: 4,
                          decoration: InputDecoration(
                            hintText: 'আপনার প্রশ্ন লিখুন...',
                            filled: true,
                            fillColor: AppColors.background,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide:
                                  const BorderSide(color: AppColors.border),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide:
                                  const BorderSide(color: AppColors.border),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide:
                                  const BorderSide(color: AppColors.primary),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      SizedBox(
                        height: 52,
                        width: 52,
                        child: ElevatedButton(
                          onPressed: state.isSending ? null : _sendMessage,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: EdgeInsets.zero,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: state.isSending
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.send_rounded,
                                  color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickChip(String label) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(label),
        backgroundColor: AppColors.background,
        labelStyle: const TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        side: const BorderSide(color: AppColors.border),
        onPressed: () {
          _messageController.text = label;
          _messageController.selection = TextSelection.fromPosition(
            TextPosition(offset: _messageController.text.length),
          );
        },
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});

  final TutorMessage message;

  String _formatTime(DateTime createdAt) {
    final diff = DateTime.now().difference(createdAt);
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
    final isUser = message.isUser;
    final createdAt = message.createdAt;

    if (isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          margin: const EdgeInsets.only(left: 48),
          padding: const EdgeInsets.all(14),
          decoration: const BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
              bottomLeft: Radius.circular(20),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                message.content,
                style: const TextStyle(
                    fontSize: 15, color: Colors.white, height: 1.5),
              ),
              const SizedBox(height: 6),
              Text(
                _formatTime(createdAt),
                style: const TextStyle(fontSize: 11, color: Colors.white70),
              ),
            ],
          ),
        ),
      );
    }

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(right: 48),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: const TextStyle(
                fontSize: 15,
                height: 1.5,
                color: AppColors.textPrimary,
              ),
            ),
            if (message.citations.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final citation in message.citations)
                    Chip(
                      label: Text(
                        citation.sourceBook,
                        style: const TextStyle(fontSize: 11),
                      ),
                      backgroundColor: AppColors.primary.withAlpha(18),
                      visualDensity: VisualDensity.compact,
                      side: BorderSide.none,
                    ),
                ],
              ),
            ],
            const SizedBox(height: 6),
            Text(
              _formatTime(createdAt),
              style:
                  const TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
