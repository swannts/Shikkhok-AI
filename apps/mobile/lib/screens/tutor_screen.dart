import 'package:flutter/material.dart';
import '../core/network/http_client.dart';
import '../core/theme/theme.dart';

class TutorScreen extends StatefulWidget {
  const TutorScreen({super.key});

  @override
  State<TutorScreen> createState() => _TutorScreenState();
}

class _TutorScreenState extends State<TutorScreen> {
  final List<Map<String, String>> _messages = [
    {'role': 'assistant', 'content': 'আমি তোমার শিক্ষক AI 🤖। গণিত বা বিজ্ঞানের যেকোনো প্রশ্ন আমাকে জিজ্ঞেস করো!'}
  ];
  final _inputController = TextEditingController();
  bool _isStreaming = false;

  void _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isStreaming) return;

    _inputController.clear();
    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _messages.add({'role': 'assistant', 'content': ''});
      _isStreaming = true;
    });

    try {
      await aiGatewayClient.streamText(
        '/tutor/chat/stream',
        {'messages': _messages},
        (delta) {
          if (mounted) {
            setState(() {
              final lastIdx = _messages.length - 1;
              _messages[lastIdx]['content'] = (_messages[lastIdx]['content'] ?? '') + delta;
            });
          }
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          final lastIdx = _messages.length - 1;
          _messages[lastIdx]['content'] = 'দুঃখিত, স্ট্রিমিং এ সমস্যা হয়েছে। আবার চেষ্টা করো।';
        });
      }
    } finally {
      if (mounted) setState(() => _isStreaming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI শিক্ষক (Bangla Tutor)')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, idx) {
                final msg = _messages[idx];
                final isUser = msg['role'] == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser ? AppTheme.primary : AppTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: isUser ? null : Border.all(color: AppTheme.border),
                    ),
                    child: Text(
                      msg['content'] ?? '',
                      style: TextStyle(color: isUser ? Colors.white : AppTheme.textPrimary, fontSize: 16),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: const InputDecoration(
                      hintText: 'প্রশ্ন করো...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: _isStreaming ? const CircularProgressIndicator() : const Icon(Icons.send, color: AppTheme.primary),
                  onPressed: _isStreaming ? null : _sendMessage,
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
