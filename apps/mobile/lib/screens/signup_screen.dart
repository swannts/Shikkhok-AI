import 'package:flutter/material.dart';
import '../core/theme/theme.dart';
import '../repositories/auth_repository.dart';
import 'verify_otp_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  void _handleSignup() async {
    if (_nameController.text.isEmpty || _phoneController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() => _errorMessage = 'সবগুলো তথ্য সঠিকভাবে পূরণ করুন');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await authRepository.signup(
        _nameController.text.trim(),
        _phoneController.text.trim(),
        _passwordController.text.trim(),
      );

      final refId = res['referenceId'] ?? 'ref-123';
      if (mounted) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => VerifyOtpScreen(referenceId: refId)));
      }
    } catch (e) {
      setState(() => _errorMessage = 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('নতুন অ্যাকাউন্ট')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(color: AppTheme.error.withAlpha(25), borderRadius: BorderRadius.circular(8)),
                child: Text(_errorMessage!, style: const TextStyle(color: AppTheme.error)),
              ),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'তোমার নাম', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'ফোন নম্বর বা ইমেইল', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'পাসওয়ার্ড', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleSignup,
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('ওটিপি পাঠান', style: TextStyle(fontSize: 18, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
