import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bn.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bn'),
    Locale('en')
  ];

  /// No description provided for @appName.
  ///
  /// In bn, this message translates to:
  /// **'শিক্ষক AI'**
  String get appName;

  /// No description provided for @appSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'তোমার ব্যক্তিগত AI শিক্ষক'**
  String get appSubtitle;

  /// No description provided for @appTagline.
  ///
  /// In bn, this message translates to:
  /// **'শিখো • বুঝো • এগিয়ে যাও'**
  String get appTagline;

  /// No description provided for @loadingApp.
  ///
  /// In bn, this message translates to:
  /// **'শেখার জগৎ প্রস্তুত হচ্ছে...'**
  String get loadingApp;

  /// No description provided for @skip.
  ///
  /// In bn, this message translates to:
  /// **'এড়িয়ে যান'**
  String get skip;

  /// No description provided for @next.
  ///
  /// In bn, this message translates to:
  /// **'পরবর্তী'**
  String get next;

  /// No description provided for @back.
  ///
  /// In bn, this message translates to:
  /// **'পেছনে'**
  String get back;

  /// No description provided for @onboarding1Title.
  ///
  /// In bn, this message translates to:
  /// **'কঠিন বিষয় এখন সহজ'**
  String get onboarding1Title;

  /// No description provided for @onboarding1Description.
  ///
  /// In bn, this message translates to:
  /// **'তোমার ক্লাস ও পাঠ্যবই অনুযায়ী সহজ ভাষায় ধাপে ধাপে শিখো।'**
  String get onboarding1Description;

  /// No description provided for @onboarding2Title.
  ///
  /// In bn, this message translates to:
  /// **'প্রশ্ন করো AI শিক্ষককে'**
  String get onboarding2Title;

  /// No description provided for @onboarding2Description.
  ///
  /// In bn, this message translates to:
  /// **'গণিত, বিজ্ঞান, ইংরেজি বা অন্য যেকোনো বিষয়ে প্রশ্ন করো। AI শিক্ষক তোমাকে শুধু উত্তর নয়, বুঝতেও সাহায্য করবে।'**
  String get onboarding2Description;

  /// No description provided for @chipStepByStep.
  ///
  /// In bn, this message translates to:
  /// **'ধাপে ধাপে ব্যাখ্যা'**
  String get chipStepByStep;

  /// No description provided for @chipHint.
  ///
  /// In bn, this message translates to:
  /// **'হিন্ট'**
  String get chipHint;

  /// No description provided for @chipNctbBased.
  ///
  /// In bn, this message translates to:
  /// **'NCTB ভিত্তিক'**
  String get chipNctbBased;

  /// No description provided for @welcomeTitle.
  ///
  /// In bn, this message translates to:
  /// **'স্বাগতম! 👋'**
  String get welcomeTitle;

  /// No description provided for @welcomeSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'তোমার অ্যাকাউন্টে লগইন করো'**
  String get welcomeSubtitle;

  /// No description provided for @identifierLabel.
  ///
  /// In bn, this message translates to:
  /// **'ইমেইল বা ফোন নম্বর'**
  String get identifierLabel;

  /// No description provided for @passwordLabel.
  ///
  /// In bn, this message translates to:
  /// **'পাসওয়ার্ড'**
  String get passwordLabel;

  /// No description provided for @loginButton.
  ///
  /// In bn, this message translates to:
  /// **'লগইন'**
  String get loginButton;

  /// No description provided for @noAccount.
  ///
  /// In bn, this message translates to:
  /// **'অ্যাকাউন্ট নেই? '**
  String get noAccount;

  /// No description provided for @createAccount.
  ///
  /// In bn, this message translates to:
  /// **'নতুন অ্যাকাউন্ট তৈরি করো'**
  String get createAccount;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['bn', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bn':
      return AppLocalizationsBn();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
