// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Shikkhok AI';

  @override
  String get appSubtitle => 'Your Personal AI Teacher';

  @override
  String get appTagline => 'Learn • Understand • Succeed';

  @override
  String get loadingApp => 'Preparing your learning world...';

  @override
  String get skip => 'Skip';

  @override
  String get next => 'Next';

  @override
  String get back => 'Back';

  @override
  String get onboarding1Title => 'Complex Topics Made Simple';

  @override
  String get onboarding1Description =>
      'Learn step by step in simple language aligned with your class & NCTB textbooks.';

  @override
  String get onboarding2Title => 'Ask the AI Teacher';

  @override
  String get onboarding2Description =>
      'Ask questions on Math, Science, English or any subject. The AI Teacher helps you understand, not just get answers.';

  @override
  String get onboarding3Title => 'Advance at Your Own Pace';

  @override
  String get onboarding3Description =>
      'Identify weak subjects through practice, exams, and AI diagnostics to improve every single day.';

  @override
  String get startLearning => 'Get Started';

  @override
  String get chipStepByStep => 'Step-by-step Explanation';

  @override
  String get chipHint => 'Hints';

  @override
  String get chipNctbBased => 'NCTB Grounded';

  @override
  String get chipProgress => 'Progress';

  @override
  String get chipPractice => 'Practice';

  @override
  String get chipStudyPlan => 'Study Plan';

  @override
  String get roleSelectionTitle => 'How will you use Shikkhok-AI?';

  @override
  String get roleSelectionSubtitle => 'Select your role to continue';

  @override
  String get studentRole => 'Student';

  @override
  String get studentRoleDesc => 'Studies, AI tutor, practice & exams';

  @override
  String get parentRole => 'Parent';

  @override
  String get parentRoleDesc => 'Track your child\'s learning progress';

  @override
  String get teacherRole => 'Teacher';

  @override
  String get teacherRoleDesc => 'Manage student learning analytics';

  @override
  String get continueButton => 'Continue';

  @override
  String get welcomeTitle => 'Welcome!';

  @override
  String get welcomeSubtitle => 'Log in to continue learning';

  @override
  String get identifierLabel => 'Mobile Number or Email';

  @override
  String get identifierPlaceholder => '01XXX-XXXXXX';

  @override
  String get invalidIdentifier => 'Please enter a valid mobile number or email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get passwordPlaceholder => '••••••••';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get loginButton => 'Login';

  @override
  String get orDivider => 'OR';

  @override
  String get googleLogin => 'Continue with Google';

  @override
  String get noAccount => 'New user? ';

  @override
  String get createAccount => 'Create Account';

  @override
  String get signupTitle => 'Create Account';

  @override
  String get signupSubtitle => 'Start learning with just a few details';

  @override
  String get fullNameLabel => 'Full Name';

  @override
  String get fullNamePlaceholder => 'Enter your full name';

  @override
  String get mobileNumberLabel => 'Mobile Number';

  @override
  String get mobileNumberPlaceholder => '01XXXXXXXXX';

  @override
  String get invalidPhone => 'Please enter a valid number';

  @override
  String get emailOptionalLabel => 'Email (Optional)';

  @override
  String get emailPlaceholder => 'example@mail.com';

  @override
  String get confirmPasswordLabel => 'Confirm Password';

  @override
  String get termsAgreement =>
      'I agree to the Terms of Service & Privacy Policy';

  @override
  String get alreadyHaveAccount => 'Already have an account? ';

  @override
  String get loginLink => 'Log in';

  @override
  String get verifyMobileTitle => 'Verify Mobile Number';

  @override
  String verifyMobileSub(Object phone) {
    return 'Enter the 6-digit code sent to $phone';
  }

  @override
  String resendCodeTimer(Object seconds) {
    return 'Resend code in $seconds seconds';
  }

  @override
  String get resendCodeNow => 'Resend Code';

  @override
  String get verifyButton => 'Verify Code';

  @override
  String get changeNumber => 'Change Number';
}
