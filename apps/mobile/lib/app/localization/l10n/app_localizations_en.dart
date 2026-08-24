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
  String get chipStepByStep => 'Step-by-step Explanation';

  @override
  String get chipHint => 'Hints';

  @override
  String get chipNctbBased => 'NCTB Grounded';

  @override
  String get welcomeTitle => 'Welcome! 👋';

  @override
  String get welcomeSubtitle => 'Log in to your account';

  @override
  String get identifierLabel => 'Email or Phone Number';

  @override
  String get passwordLabel => 'Password';

  @override
  String get loginButton => 'Login';

  @override
  String get noAccount => 'Don\'t have an account? ';

  @override
  String get createAccount => 'Create New Account';
}
