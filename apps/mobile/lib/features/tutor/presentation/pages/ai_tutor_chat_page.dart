import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class AiTutorChatPage extends StatefulWidget {
  const AiTutorChatPage({super.key});

  @override
  State<AiTutorChatPage> createState() => _AiTutorChatPageState();
}

class _AiTutorChatPageState extends State<AiTutorChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [
    {
      'isUser': true,
      'text': '2x + 5 = 15 কীভাবে সমাধান করবো?',
      'time': '১০:২৫ AM',
    },
    {
      'isUser': false,
      'text': 'চলো ধাপে ধাপে করি। প্রথমে আমাদের x-কে একা করতে হবে।',
      'formula': '2x + 5 = 15',
      'question': 'দুই পাশ থেকে ৫ বিয়োগ করলে কী হবে বলে মনে হয়?',
    },
    {
      'isUser': false,
      'text': 'একদম ঠিক! আমরা ৫ বিয়োগ করলে পাই 2x = 10। এখন x এর মান বের করতে দুই পক্ষকে ২ দিয়ে ভাগ করতে হবে।',
      'citation': 'উৎস: NCTB গণিত, ৮ম শ্রেণি, অধ্যায় ৪',
    },
  ];

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;
    setState(() {
      _messages.add({
        'isUser': true,
        'text': text.trim(),
        'time': '১০:২৬ AM',
      });
      _messageController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/lesson-reader'),
        ),
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primary.withAlpha(20),
                  child: const Icon(Icons.school_rounded, color: AppColors.primary, size: 22),
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
                  l10n.aiTutorTitle,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const Text(
                  '৮ম শ্রেণি • গণিত',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded, color: AppColors.textSecondary),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Context Chip Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 8),
              color: AppColors.surface,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primary.withAlpha(40)),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.calculate_rounded, size: 14, color: AppColors.primary),
                        SizedBox(width: 4),
                        Text(
                          'সরল সমীকরণ',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // Chat Messages List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  final isUser = msg['isUser'] == true;

                  if (isUser) {
                    return Align(
                      alignment: Alignment.centerRight,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12, left: 40),
                        padding: const EdgeInsets.all(14),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(20),
                            topRight: Radius.circular(20),
                            bottomLeft: Radius.circular(20),
                          ),
                        ),
                        child: Text(
                          msg['text'],
                          style: const TextStyle(fontSize: 15, color: Colors.white),
                        ),
                      ),
                    );
                  }

                  return Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16, right: 40),
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
                            msg['text'],
                            style: const TextStyle(fontSize: 15, height: 1.5, color: AppColors.textPrimary),
                          ),
                          if (msg['formula'] != null) ...[
                            const SizedBox(height: 10),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                msg['formula'],
                                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            ),
                          ],
                          if (msg['question'] != null) ...[
                            const SizedBox(height: 10),
                            Text(
                              msg['question'],
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                          ],
                          if (msg['citation'] != null) ...[
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                const Icon(Icons.menu_book_rounded, size: 14, color: AppColors.textSecondary),
                                const SizedBox(width: 4),
                                Text(
                                  msg['citation'],
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            // Quick Reply Chips
            SizedBox(
              height: 42,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                children: [
                  _buildQuickChip('2x = 10'),
                  _buildQuickChip(l10n.hintOption),
                  _buildQuickChip(l10n.dontUnderstandOption),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Composer Footer Input Bar
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.textSecondary),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(Icons.photo_camera_outlined, color: AppColors.textSecondary),
                    onPressed: () {},
                  ),
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: InputDecoration(
                        hintText: l10n.askPlaceholder,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                      onSubmitted: _sendMessage,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.mic_none_rounded, color: AppColors.textSecondary),
                    onPressed: () {},
                  ),
                  Container(
                    margin: const EdgeInsets.only(right: 4),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                      onPressed: () => _sendMessage(_messageController.text),
                    ),
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
        label: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary.withAlpha(15),
        side: const BorderSide(color: AppColors.primary),
        onPressed: () => _sendMessage(label),
      ),
    );
  }
}
