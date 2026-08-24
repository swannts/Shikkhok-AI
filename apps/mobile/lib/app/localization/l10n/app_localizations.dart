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

  /// No description provided for @onboarding3Title.
  ///
  /// In bn, this message translates to:
  /// **'নিজের গতিতে এগিয়ে যাও'**
  String get onboarding3Title;

  /// No description provided for @onboarding3Description.
  ///
  /// In bn, this message translates to:
  /// **'প্র্যাকটিস, পরীক্ষা এবং AI বিশ্লেষণের মাধ্যমে দুর্বল বিষয় খুঁজে বের করো এবং প্রতিদিন উন্নতি করো।'**
  String get onboarding3Description;

  /// No description provided for @startLearning.
  ///
  /// In bn, this message translates to:
  /// **'শুরু করি'**
  String get startLearning;

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

  /// No description provided for @chipProgress.
  ///
  /// In bn, this message translates to:
  /// **'প্রগ্রেস'**
  String get chipProgress;

  /// No description provided for @chipPractice.
  ///
  /// In bn, this message translates to:
  /// **'প্র্যাকটিস'**
  String get chipPractice;

  /// No description provided for @chipStudyPlan.
  ///
  /// In bn, this message translates to:
  /// **'স্টাডি প্ল্যান'**
  String get chipStudyPlan;

  /// No description provided for @roleSelectionTitle.
  ///
  /// In bn, this message translates to:
  /// **'আপনি কীভাবে Shikkhok-AI ব্যবহার করবেন?'**
  String get roleSelectionTitle;

  /// No description provided for @roleSelectionSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'আপনার ভূমিকা নির্বাচন করুন'**
  String get roleSelectionSubtitle;

  /// No description provided for @studentRole.
  ///
  /// In bn, this message translates to:
  /// **'শিক্ষার্থী'**
  String get studentRole;

  /// No description provided for @studentRoleDesc.
  ///
  /// In bn, this message translates to:
  /// **'পড়াশোনা, AI শিক্ষক, প্র্যাকটিস ও পরীক্ষা'**
  String get studentRoleDesc;

  /// No description provided for @parentRole.
  ///
  /// In bn, this message translates to:
  /// **'অভিভাবক'**
  String get parentRole;

  /// No description provided for @parentRoleDesc.
  ///
  /// In bn, this message translates to:
  /// **'সন্তানের শেখার অগ্রগতি দেখুন'**
  String get parentRoleDesc;

  /// No description provided for @teacherRole.
  ///
  /// In bn, this message translates to:
  /// **'শিক্ষক'**
  String get teacherRole;

  /// No description provided for @teacherRoleDesc.
  ///
  /// In bn, this message translates to:
  /// **'শিক্ষার্থীদের শেখার অগ্রগতি পরিচালনা করুন'**
  String get teacherRoleDesc;

  /// No description provided for @continueButton.
  ///
  /// In bn, this message translates to:
  /// **'চালিয়ে যান'**
  String get continueButton;

  /// No description provided for @welcomeTitle.
  ///
  /// In bn, this message translates to:
  /// **'স্বাগতম!'**
  String get welcomeTitle;

  /// No description provided for @welcomeSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'পড়াশোনা চালিয়ে যেতে লগইন করুন'**
  String get welcomeSubtitle;

  /// No description provided for @identifierLabel.
  ///
  /// In bn, this message translates to:
  /// **'মোবাইল নম্বর অথবা ইমেইল'**
  String get identifierLabel;

  /// No description provided for @identifierPlaceholder.
  ///
  /// In bn, this message translates to:
  /// **'01XXX-XXXXXX'**
  String get identifierPlaceholder;

  /// No description provided for @invalidIdentifier.
  ///
  /// In bn, this message translates to:
  /// **'সঠিক মোবাইল নম্বর বা ইমেইল দিন'**
  String get invalidIdentifier;

  /// No description provided for @passwordLabel.
  ///
  /// In bn, this message translates to:
  /// **'পাসওয়ার্ড'**
  String get passwordLabel;

  /// No description provided for @passwordPlaceholder.
  ///
  /// In bn, this message translates to:
  /// **'••••••••'**
  String get passwordPlaceholder;

  /// No description provided for @forgotPassword.
  ///
  /// In bn, this message translates to:
  /// **'পাসওয়ার্ড ভুলে গেছেন?'**
  String get forgotPassword;

  /// No description provided for @loginButton.
  ///
  /// In bn, this message translates to:
  /// **'লগইন'**
  String get loginButton;

  /// No description provided for @orDivider.
  ///
  /// In bn, this message translates to:
  /// **'অথবা'**
  String get orDivider;

  /// No description provided for @googleLogin.
  ///
  /// In bn, this message translates to:
  /// **'Google দিয়ে চালিয়ে যান'**
  String get googleLogin;

  /// No description provided for @noAccount.
  ///
  /// In bn, this message translates to:
  /// **'নতুন ব্যবহারকারী? '**
  String get noAccount;

  /// No description provided for @createAccount.
  ///
  /// In bn, this message translates to:
  /// **'অ্যাকাউন্ট তৈরি করুন'**
  String get createAccount;

  /// No description provided for @signupTitle.
  ///
  /// In bn, this message translates to:
  /// **'অ্যাকাউন্ট তৈরি করুন'**
  String get signupTitle;

  /// No description provided for @signupSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'মাত্র কয়েকটি তথ্য দিয়ে শেখা শুরু করুন'**
  String get signupSubtitle;

  /// No description provided for @fullNameLabel.
  ///
  /// In bn, this message translates to:
  /// **'পূর্ণ নাম'**
  String get fullNameLabel;

  /// No description provided for @fullNamePlaceholder.
  ///
  /// In bn, this message translates to:
  /// **'আপনার নাম লিখুন'**
  String get fullNamePlaceholder;

  /// No description provided for @mobileNumberLabel.
  ///
  /// In bn, this message translates to:
  /// **'মোবাইল নম্বর'**
  String get mobileNumberLabel;

  /// No description provided for @mobileNumberPlaceholder.
  ///
  /// In bn, this message translates to:
  /// **'০১XXXXXXXXX'**
  String get mobileNumberPlaceholder;

  /// No description provided for @invalidPhone.
  ///
  /// In bn, this message translates to:
  /// **'সঠিক নম্বর দিন'**
  String get invalidPhone;

  /// No description provided for @emailOptionalLabel.
  ///
  /// In bn, this message translates to:
  /// **'ইমেইল (ঐচ্ছিক)'**
  String get emailOptionalLabel;

  /// No description provided for @emailPlaceholder.
  ///
  /// In bn, this message translates to:
  /// **'example@mail.com'**
  String get emailPlaceholder;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In bn, this message translates to:
  /// **'পাসওয়ার্ড নিশ্চিত করুন'**
  String get confirmPasswordLabel;

  /// No description provided for @termsAgreement.
  ///
  /// In bn, this message translates to:
  /// **'আমি ব্যবহারের শর্তাবলি ও গোপনীয়তা নীতি মেনে নিচ্ছি'**
  String get termsAgreement;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In bn, this message translates to:
  /// **'ইতোমধ্যে অ্যাকাউন্ট আছে? '**
  String get alreadyHaveAccount;

  /// No description provided for @loginLink.
  ///
  /// In bn, this message translates to:
  /// **'লগইন করুন'**
  String get loginLink;

  /// No description provided for @verifyMobileTitle.
  ///
  /// In bn, this message translates to:
  /// **'মোবাইল নম্বর যাচাই করুন'**
  String get verifyMobileTitle;

  /// No description provided for @verifyMobileSub.
  ///
  /// In bn, this message translates to:
  /// **'{phone} নম্বরে পাঠানো ৬ সংখ্যার কোডটি লিখুন'**
  String verifyMobileSub(Object phone);

  /// No description provided for @resendCodeTimer.
  ///
  /// In bn, this message translates to:
  /// **'কোড আবার পাঠানো যাবে {seconds} সেকেন্ড পরে'**
  String resendCodeTimer(Object seconds);

  /// No description provided for @resendCodeNow.
  ///
  /// In bn, this message translates to:
  /// **'কোড আবার পাঠান'**
  String get resendCodeNow;

  /// No description provided for @verifyButton.
  ///
  /// In bn, this message translates to:
  /// **'যাচাই করুন'**
  String get verifyButton;

  /// No description provided for @changeNumber.
  ///
  /// In bn, this message translates to:
  /// **'নম্বর পরিবর্তন করুন'**
  String get changeNumber;

  /// No description provided for @stepProgress.
  ///
  /// In bn, this message translates to:
  /// **'ধাপ {step} / ৩'**
  String stepProgress(Object step);

  /// No description provided for @selectClassTitle.
  ///
  /// In bn, this message translates to:
  /// **'তোমার পড়াশোনা সম্পর্কে বলো'**
  String get selectClassTitle;

  /// No description provided for @selectClassSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'তুমি কোন ক্লাসে পড়ো?'**
  String get selectClassSubtitle;

  /// No description provided for @selectGroupTitle.
  ///
  /// In bn, this message translates to:
  /// **'তোমার বিভাগ নির্বাচন করো'**
  String get selectGroupTitle;

  /// No description provided for @groupScience.
  ///
  /// In bn, this message translates to:
  /// **'বিজ্ঞান (Science)'**
  String get groupScience;

  /// No description provided for @groupBusiness.
  ///
  /// In bn, this message translates to:
  /// **'ব্যবসায় শিক্ষা (Business)'**
  String get groupBusiness;

  /// No description provided for @groupHumanities.
  ///
  /// In bn, this message translates to:
  /// **'মানবিক (Humanities)'**
  String get groupHumanities;

  /// No description provided for @selectCurriculumTitle.
  ///
  /// In bn, this message translates to:
  /// **'তোমার পাঠ্যক্রম নির্বাচন করো'**
  String get selectCurriculumTitle;

  /// No description provided for @nctbTitle.
  ///
  /// In bn, this message translates to:
  /// **'NCTB বাংলাদেশ'**
  String get nctbTitle;

  /// No description provided for @nctbSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড'**
  String get nctbSubtitle;

  /// No description provided for @academicYear.
  ///
  /// In bn, this message translates to:
  /// **'শিক্ষাবর্ষ ২০২৬'**
  String get academicYear;

  /// No description provided for @curriculumSubjects.
  ///
  /// In bn, this message translates to:
  /// **'এই পাঠ্যক্রমের বিষয়সমূহ:'**
  String get curriculumSubjects;

  /// No description provided for @selectGoalTitle.
  ///
  /// In bn, this message translates to:
  /// **'তোমার শেখার লক্ষ্য কী?'**
  String get selectGoalTitle;

  /// No description provided for @selectGoalSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'একাধিক নির্বাচন করতে পারো'**
  String get selectGoalSubtitle;

  /// No description provided for @goalSchool.
  ///
  /// In bn, this message translates to:
  /// **'স্কুলের পড়া বুঝতে চাই'**
  String get goalSchool;

  /// No description provided for @goalExam.
  ///
  /// In bn, this message translates to:
  /// **'পরীক্ষার প্রস্তুতি নিতে চাই'**
  String get goalExam;

  /// No description provided for @goalWeakness.
  ///
  /// In bn, this message translates to:
  /// **'দুর্বল বিষয় ভালো করতে চাই'**
  String get goalWeakness;

  /// No description provided for @goalPractice.
  ///
  /// In bn, this message translates to:
  /// **'নিয়মিত প্র্যাকটিস করতে চাই'**
  String get goalPractice;

  /// No description provided for @goalAiTutor.
  ///
  /// In bn, this message translates to:
  /// **'AI শিক্ষকের সাহায্য চাই'**
  String get goalAiTutor;

  /// No description provided for @dailyTimeTitle.
  ///
  /// In bn, this message translates to:
  /// **'প্রতিদিন কতক্ষণ পড়তে চাও?'**
  String get dailyTimeTitle;

  /// No description provided for @minutesUnit.
  ///
  /// In bn, this message translates to:
  /// **'মিনিট'**
  String get minutesUnit;

  /// No description provided for @startLearningGoal.
  ///
  /// In bn, this message translates to:
  /// **'আমার শেখা শুরু করুন'**
  String get startLearningGoal;

  /// No description provided for @greetingMorning.
  ///
  /// In bn, this message translates to:
  /// **'সুপ্রভাত, {name} 👋'**
  String greetingMorning(Object name);

  /// No description provided for @greetingSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'আজ কী শিখতে চাও?'**
  String get greetingSubtitle;

  /// No description provided for @streakDays.
  ///
  /// In bn, this message translates to:
  /// **'{days} দিন টানা'**
  String streakDays(Object days);

  /// No description provided for @askAiTutorTitle.
  ///
  /// In bn, this message translates to:
  /// **'AI শিক্ষককে জিজ্ঞেস করো'**
  String get askAiTutorTitle;

  /// No description provided for @askAiTutorSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'যে প্রশ্ন বুঝতে পারছ না, আমাকে বলো'**
  String get askAiTutorSubtitle;

  /// No description provided for @askPlaceholder.
  ///
  /// In bn, this message translates to:
  /// **'তোমার প্রশ্ন লিখো...'**
  String get askPlaceholder;

  /// No description provided for @todaysStudyPlan.
  ///
  /// In bn, this message translates to:
  /// **'আজকের পড়াশোনা'**
  String get todaysStudyPlan;

  /// No description provided for @simpleEquation.
  ///
  /// In bn, this message translates to:
  /// **'সরল সমীকরণ'**
  String get simpleEquation;

  /// No description provided for @continueLearning.
  ///
  /// In bn, this message translates to:
  /// **'যেখান থেকে থেমেছিলে'**
  String get continueLearning;

  /// No description provided for @mastery.
  ///
  /// In bn, this message translates to:
  /// **'মাস্তারি {percent}%'**
  String mastery(Object percent);

  /// No description provided for @subjectsHeader.
  ///
  /// In bn, this message translates to:
  /// **'বিষয়সমূহ'**
  String get subjectsHeader;

  /// No description provided for @seeAll.
  ///
  /// In bn, this message translates to:
  /// **'সব দেখুন'**
  String get seeAll;

  /// No description provided for @todaysProgress.
  ///
  /// In bn, this message translates to:
  /// **'আজকের অগ্রগতি'**
  String get todaysProgress;

  /// No description provided for @greatProgress.
  ///
  /// In bn, this message translates to:
  /// **'দারুণ উন্নতি করছো!'**
  String get greatProgress;

  /// No description provided for @progressSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'আজকের লক্ষ্যমাত্রার {percent}% পূর্ণ হয়েছে'**
  String progressSubtitle(Object percent);

  /// No description provided for @timeSpent.
  ///
  /// In bn, this message translates to:
  /// **'সময়'**
  String get timeSpent;

  /// No description provided for @questionsAnswered.
  ///
  /// In bn, this message translates to:
  /// **'প্রশ্ন'**
  String get questionsAnswered;

  /// No description provided for @accuracy.
  ///
  /// In bn, this message translates to:
  /// **'সঠিক'**
  String get accuracy;

  /// No description provided for @learnHeader.
  ///
  /// In bn, this message translates to:
  /// **'শিখন'**
  String get learnHeader;

  /// No description provided for @searchSubjectPlaceholder.
  ///
  /// In bn, this message translates to:
  /// **'বিষয় বা অধ্যায় খুঁজুন'**
  String get searchSubjectPlaceholder;

  /// No description provided for @allSubjects.
  ///
  /// In bn, this message translates to:
  /// **'সব বিষয়'**
  String get allSubjects;

  /// No description provided for @scienceGroup.
  ///
  /// In bn, this message translates to:
  /// **'বিজ্ঞান বিভাগ'**
  String get scienceGroup;

  /// No description provided for @humanitiesGroup.
  ///
  /// In bn, this message translates to:
  /// **'মানবিক বিভাগ'**
  String get humanitiesGroup;

  /// No description provided for @businessGroup.
  ///
  /// In bn, this message translates to:
  /// **'ব্যবসায় শিক্ষা'**
  String get businessGroup;

  /// No description provided for @chapterCount.
  ///
  /// In bn, this message translates to:
  /// **'{chapters} অধ্যায় • {lessons} পাঠ'**
  String chapterCount(Object chapters, Object lessons);

  /// No description provided for @subjectMath.
  ///
  /// In bn, this message translates to:
  /// **'গণিত'**
  String get subjectMath;

  /// No description provided for @subjectScience.
  ///
  /// In bn, this message translates to:
  /// **'বিজ্ঞান'**
  String get subjectScience;

  /// No description provided for @subjectBangla.
  ///
  /// In bn, this message translates to:
  /// **'বাংলা'**
  String get subjectBangla;

  /// No description provided for @subjectEnglish.
  ///
  /// In bn, this message translates to:
  /// **'English'**
  String get subjectEnglish;

  /// No description provided for @subjectIct.
  ///
  /// In bn, this message translates to:
  /// **'ICT'**
  String get subjectIct;

  /// No description provided for @subjectSocial.
  ///
  /// In bn, this message translates to:
  /// **'বাংলাদেশ ও বিশ্বপরিচয়'**
  String get subjectSocial;

  /// No description provided for @chapterDetailsTitle.
  ///
  /// In bn, this message translates to:
  /// **'অধ্যায় বিস্তারিত'**
  String get chapterDetailsTitle;

  /// No description provided for @algebraFormulas.
  ///
  /// In bn, this message translates to:
  /// **'বীজগণিতীয় সূত্রাবলি'**
  String get algebraFormulas;

  /// No description provided for @mathClass8.
  ///
  /// In bn, this message translates to:
  /// **'গণিত • ৮ম শ্রেণি'**
  String get mathClass8;

  /// No description provided for @chapterComplete.
  ///
  /// In bn, this message translates to:
  /// **'অধ্যায় সম্পন্ন'**
  String get chapterComplete;

  /// No description provided for @lessonsDone.
  ///
  /// In bn, this message translates to:
  /// **'১০টির মধ্যে ৪টি পাঠ সম্পন্ন'**
  String get lessonsDone;

  /// No description provided for @practiceAction.
  ///
  /// In bn, this message translates to:
  /// **'প্র্যাকটিস করুন'**
  String get practiceAction;

  /// No description provided for @chapterExam.
  ///
  /// In bn, this message translates to:
  /// **'অধ্যায় পরীক্ষা'**
  String get chapterExam;

  /// No description provided for @lessonsList.
  ///
  /// In bn, this message translates to:
  /// **'পাঠসমূহ'**
  String get lessonsList;

  /// No description provided for @lesson1.
  ///
  /// In bn, this message translates to:
  /// **'বীজগণিতীয় রাশি'**
  String get lesson1;

  /// No description provided for @lesson2.
  ///
  /// In bn, this message translates to:
  /// **'সূত্রের ধারণা'**
  String get lesson2;

  /// No description provided for @lesson3.
  ///
  /// In bn, this message translates to:
  /// **'সূত্রের প্রয়োগ'**
  String get lesson3;

  /// No description provided for @lesson4.
  ///
  /// In bn, this message translates to:
  /// **'সরল সমীকরণ'**
  String get lesson4;

  /// No description provided for @lesson5.
  ///
  /// In bn, this message translates to:
  /// **'সমীকরণ সমাধান'**
  String get lesson5;

  /// No description provided for @lessonReaderTitle.
  ///
  /// In bn, this message translates to:
  /// **'সরল সমীকরণ'**
  String get lessonReaderTitle;

  /// No description provided for @chapter4Math.
  ///
  /// In bn, this message translates to:
  /// **'গণিত • অধ্যায় ৪'**
  String get chapter4Math;

  /// No description provided for @whatIsSimpleEq.
  ///
  /// In bn, this message translates to:
  /// **'সরল সমীকরণ কী?'**
  String get whatIsSimpleEq;

  /// No description provided for @rememberBoxTitle.
  ///
  /// In bn, this message translates to:
  /// **'মনে রাখো'**
  String get rememberBoxTitle;

  /// No description provided for @solutionProcess.
  ///
  /// In bn, this message translates to:
  /// **'সমাধান প্রক্রিয়া'**
  String get solutionProcess;

  /// No description provided for @prevLesson.
  ///
  /// In bn, this message translates to:
  /// **'আগের পাঠ'**
  String get prevLesson;

  /// No description provided for @nextLesson.
  ///
  /// In bn, this message translates to:
  /// **'পরবর্তী পাঠ'**
  String get nextLesson;

  /// No description provided for @aiTutorTitle.
  ///
  /// In bn, this message translates to:
  /// **'AI শিক্ষক'**
  String get aiTutorTitle;

  /// No description provided for @thinking.
  ///
  /// In bn, this message translates to:
  /// **'ভাবছি...'**
  String get thinking;

  /// No description provided for @hintOption.
  ///
  /// In bn, this message translates to:
  /// **'একটু হিন্ট দিন'**
  String get hintOption;

  /// No description provided for @dontUnderstandOption.
  ///
  /// In bn, this message translates to:
  /// **'বুঝতে পারছি না'**
  String get dontUnderstandOption;

  /// No description provided for @sourceCitation.
  ///
  /// In bn, this message translates to:
  /// **'উৎস: NCTB গণিত, ৮ম শ্রেণি, অধ্যায় ৪'**
  String get sourceCitation;
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
