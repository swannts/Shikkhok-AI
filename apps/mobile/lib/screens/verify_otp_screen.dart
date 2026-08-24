import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_provider.dart';
import '../core/theme/theme.dart';

class VerifyOtpScreen extends StatefulWidget {
  final String referenceId;
  const VerifyOtpScreen({super.key, required this.referenceId});

  @override
  State<VerifyOtpScreen> createState() => _VerifyOtpScreenState();
}

class _VerifyOtpScreenState extends State<VerifyOtpScreen> {
  final _otpController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  void _handleVerify() async {
    if (_otpController.text.trim().length != 6) {
      setState(() => _errorMessage = '৬ সংখ্যার ওটিপি কোড লিখুন');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await Provider.of<AuthProvider>(context, listen: false).verifyOtp(
        widget.referenceId,
        _otpController.text.trim(),
      );
      if (mounted) Navigator.popUntil(context, (route) => route.isFirst);
    } catch (e) {
      setState(() => _errorMessage = 'ভুল ওটিপি কোড। আবার চেষ্টা করুন।');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ওটিপি যাচাই')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text('তোমার নম্বরে ৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে', style: TextStyle(fontSize: 16)),
            const SizedBox(height: 24),
            if (_errorMessage != null)
              Text(_errorMessage!, style: const TextStyle(color: AppTheme.error)),
            const SizedBox(height: 16),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, letterSpacing: 8),
              decoration: const InputDecoration(border: OutlineInputBorder(), counterText: ''),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleVerify,
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('যাচাই করো', style: TextStyle(fontSize: 18, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
