import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../controllers/auth_controller.dart';
import '../state/auth_state.dart';

class VerifyOtpPage extends ConsumerStatefulWidget {
  final String referenceId;
  const VerifyOtpPage({super.key, required this.referenceId});

  @override
  ConsumerState<VerifyOtpPage> createState() => _VerifyOtpPageState();
}

class _VerifyOtpPageState extends ConsumerState<VerifyOtpPage> {
  final _otpController = TextEditingController();

  void _handleVerify() {
    final otp = _otpController.text.trim();
    if (otp.length == 6) {
      ref.read(authControllerProvider.notifier).verifyOtp(widget.referenceId, otp);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState is AuthLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('ওটিপি যাচাই')),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            const Text('তোমার নম্বরে ৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে', style: TextStyle(fontSize: 16)),
            const SizedBox(height: AppSpacing.lg),
            if (authState is AuthFailureState)
              Text(authState.failure.banglaMessage, style: const TextStyle(color: AppColors.error)),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, letterSpacing: 8),
              decoration: const InputDecoration(border: OutlineInputBorder(), counterText: ''),
            ),
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: isLoading ? null : _handleVerify,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                child: isLoading
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
