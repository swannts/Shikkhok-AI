import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Shikkhok AI')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDark]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('আজকের লক্ষ্য 🔥', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('৫ দিন টানা পড়াশোনার স্ট্রিক! ২/৩টি বিষয় সম্পন্ন হয়েছে।', style: TextStyle(color: Colors.white70, fontSize: 14)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('পড়া চালিয়ে যাও 📖', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Text('📐', style: TextStyle(fontSize: 32)),
              title: const Text('গণিত (Class 8)'),
              subtitle: const Text('অধ্যায় ১: বীজগণিতীয় রাশি ও সমীকরণ'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Text('🔬', style: TextStyle(fontSize: 32)),
              title: const Text('বিজ্ঞান (Class 8)'),
              subtitle: const Text('অধ্যায় ৩: সালোকসংশ্লেষণ ও শ্বসন'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}
