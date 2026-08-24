import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../domain/entities/user.dart';
import '../controllers/auth_controller.dart';
import '../state/auth_state.dart';

class SignupPage extends ConsumerStatefulWidget {
  const SignupPage({
    super.key,
    this.initialRole,
  });

  final UserRole? initialRole;

  @override
  ConsumerState<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends ConsumerState<SignupPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'আরিফ হোসেন');
  final _phoneController = TextEditingController(text: '01711223344');
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController(text: 'password123');
  final _confirmPasswordController = TextEditingController(text: 'password123');

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptedTerms = true;
  late UserRole _selectedRole;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole ?? UserRole.student;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submitSignup() async {
    if (_formKey.currentState!.validate() && _acceptedTerms) {
      final success = await ref.read(authControllerProvider.notifier).register(
            name: _nameController.text.trim(),
            phone: _phoneController.text.trim().isNotEmpty
                ? _phoneController.text.trim()
                : null,
            email: _emailController.text.trim().isNotEmpty
                ? _emailController.text.trim()
                : null,
            password: _passwordController.text.trim(),
            role: _selectedRole,
          );

      if (success && mounted) {
        if (_selectedRole == UserRole.parent) {
          context.go('/parent-dashboard');
        } else {
          context.go('/home');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/role-selection'),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 440),
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.border),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 16,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      l10n.signupTitle,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      l10n.signupSubtitle,
                      style: const TextStyle(
                        fontSize: 15,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Failure Alert Banner
                    if (authState is AuthFailureState) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFEF4444)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 20),
                            const SizedBox(width: AppSpacing.xs),
                            Expanded(
                              child: Text(
                                authState.failure.banglaMessage,
                                style: const TextStyle(
                                  color: Color(0xFF991B1B),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],

                    // Role Selector
                    Row(
                      children: [
                        Expanded(
                          child: ChoiceChip(
                            label: const Center(child: Text('শিক্ষার্থী (Student)')),
                            selected: _selectedRole == UserRole.student,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() => _selectedRole = UserRole.student);
                              }
                            },
                            selectedColor: AppColors.primary.withAlpha(30),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: ChoiceChip(
                            label: const Center(child: Text('অভিভাবক (Parent)')),
                            selected: _selectedRole == UserRole.parent,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() => _selectedRole = UserRole.parent);
                              }
                            },
                            selectedColor: AppColors.primary.withAlpha(30),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Name
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.fullNameLabel,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        hintText: l10n.fullNamePlaceholder,
                        prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.textSecondary),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      validator: (value) =>
                          value == null || value.trim().length < 2 ? 'সঠিক নাম দিন' : null,
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Phone
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.mobileNumberLabel,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        hintText: l10n.mobileNumberPlaceholder,
                        prefixIcon: const Icon(Icons.phone_android_rounded, color: AppColors.textSecondary),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      validator: (value) {
                        if ((value == null || value.trim().isEmpty) &&
                            _emailController.text.trim().isEmpty) {
                          return l10n.invalidPhone;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Password
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.passwordLabel,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: l10n.passwordPlaceholder,
                        prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textSecondary),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      validator: (value) =>
                          value == null || value.length < 8 ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে' : null,
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Confirm Password
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.confirmPasswordLabel,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirmPassword,
                      decoration: InputDecoration(
                        hintText: l10n.passwordPlaceholder,
                        prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textSecondary),
                        suffixIcon: IconButton(
                          icon: Icon(_obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                        ),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      validator: (value) =>
                          value != _passwordController.text ? 'পাসওয়ার্ড দুটি মিলছে না' : null,
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Terms Checkbox
                    Row(
                      children: [
                        Checkbox(
                          value: _acceptedTerms,
                          onChanged: (val) => setState(() => _acceptedTerms = val ?? false),
                          activeColor: AppColors.primary,
                        ),
                        Expanded(
                          child: Text(
                            l10n.termsAgreement,
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: (_acceptedTerms && authState is! AuthLoading)
                            ? _submitSignup
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                        child: authState is AuthLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : Text(
                                l10n.signupTitle,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Footer Login Redirect
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          l10n.alreadyHaveAccount,
                          style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: Text(
                            l10n.loginLink,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
