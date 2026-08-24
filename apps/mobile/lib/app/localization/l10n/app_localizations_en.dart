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

  @override
  String stepProgress(Object step) {
    return 'Step $step / 3';
  }

  @override
  String get selectClassTitle => 'Tell us about your studies';

  @override
  String get selectClassSubtitle => 'Which class are you in?';

  @override
  String get selectGroupTitle => 'Select your stream';

  @override
  String get groupScience => 'Science';

  @override
  String get groupBusiness => 'Business Studies';

  @override
  String get groupHumanities => 'Humanities';

  @override
  String get selectCurriculumTitle => 'Select your curriculum';

  @override
  String get nctbTitle => 'NCTB Bangladesh';

  @override
  String get nctbSubtitle => 'National Curriculum and Textbook Board';

  @override
  String get academicYear => 'Academic Year 2026';

  @override
  String get curriculumSubjects => 'Subjects in this curriculum:';

  @override
  String get selectGoalTitle => 'What is your learning goal?';

  @override
  String get selectGoalSubtitle => 'You can select multiple options';

  @override
  String get goalSchool => 'Understand school lessons';

  @override
  String get goalExam => 'Prepare for exams';

  @override
  String get goalWeakness => 'Improve weak subjects';

  @override
  String get goalPractice => 'Practice regularly';

  @override
  String get goalAiTutor => 'Get help from AI Teacher';

  @override
  String get dailyTimeTitle => 'How long do you want to study daily?';

  @override
  String get minutesUnit => 'min';

  @override
  String get startLearningGoal => 'Start My Learning';

  @override
  String greetingMorning(Object name) {
    return 'Good morning, $name 👋';
  }

  @override
  String get greetingSubtitle => 'What do you want to learn today?';

  @override
  String streakDays(Object days) {
    return '$days day streak';
  }

  @override
  String get askAiTutorTitle => 'Ask the AI Teacher';

  @override
  String get askAiTutorSubtitle =>
      'Tell me what question you don\'t understand';

  @override
  String get askPlaceholder => 'Type your question...';

  @override
  String get todaysStudyPlan => 'Today\'s Study Plan';

  @override
  String get simpleEquation => 'Simple Equations';

  @override
  String get continueLearning => 'Pick up where you left off';

  @override
  String mastery(Object percent) {
    return 'Mastery $percent%';
  }

  @override
  String get subjectsHeader => 'Subjects';

  @override
  String get seeAll => 'See All';

  @override
  String get todaysProgress => 'Today\'s Progress';

  @override
  String get greatProgress => 'Great progress!';

  @override
  String progressSubtitle(Object percent) {
    return '$percent% of today\'s goal completed';
  }

  @override
  String get timeSpent => 'Time';

  @override
  String get questionsAnswered => 'Questions';

  @override
  String get accuracy => 'Accuracy';

  @override
  String get learnHeader => 'Learn';

  @override
  String get searchSubjectPlaceholder => 'Search subject or chapter';

  @override
  String get allSubjects => 'All Subjects';

  @override
  String get scienceGroup => 'Science';

  @override
  String get humanitiesGroup => 'Humanities';

  @override
  String get businessGroup => 'Business Studies';

  @override
  String chapterCount(Object chapters, Object lessons) {
    return '$chapters Chapters • $lessons Lessons';
  }

  @override
  String get subjectMath => 'Mathematics';

  @override
  String get subjectScience => 'Science';

  @override
  String get subjectBangla => 'Bangla';

  @override
  String get subjectEnglish => 'English';

  @override
  String get subjectIct => 'ICT';

  @override
  String get subjectSocial => 'Social Science';

  @override
  String get chapterDetailsTitle => 'Chapter Details';

  @override
  String get algebraFormulas => 'Algebraic Formulas';

  @override
  String get mathClass8 => 'Mathematics • Class 8';

  @override
  String get chapterComplete => 'Chapter Progress';

  @override
  String get lessonsDone => '4 of 10 lessons completed';

  @override
  String get practiceAction => 'Practice';

  @override
  String get chapterExam => 'Chapter Exam';

  @override
  String get lessonsList => 'Lessons';

  @override
  String get lesson1 => 'Algebraic Expressions';

  @override
  String get lesson2 => 'Concept of Formulas';

  @override
  String get lesson3 => 'Application of Formulas';

  @override
  String get lesson4 => 'Simple Equations';

  @override
  String get lesson5 => 'Solving Equations';

  @override
  String get lessonReaderTitle => 'Simple Equations';

  @override
  String get chapter4Math => 'Mathematics • Chapter 4';

  @override
  String get whatIsSimpleEq => 'What is a Simple Equation?';

  @override
  String get rememberBoxTitle => 'Keep in Mind';

  @override
  String get solutionProcess => 'Solution Process';

  @override
  String get prevLesson => 'Previous Lesson';

  @override
  String get nextLesson => 'Next Lesson';

  @override
  String get aiTutorTitle => 'AI Teacher';

  @override
  String get thinking => 'Thinking...';

  @override
  String get hintOption => 'Give a hint';

  @override
  String get dontUnderstandOption => 'I don\'t understand';

  @override
  String get sourceCitation => 'Source: NCTB Mathematics, Class 8, Chapter 4';

  @override
  String get voiceTutorTitle => 'Voice Tutor';

  @override
  String get listeningMode => 'Listening...';

  @override
  String get thinkingMode => 'Thinking...';

  @override
  String get speakingMode => 'Speaking...';

  @override
  String get typeQuestion => 'Type your question';

  @override
  String get chatHistoryTitle => 'Chat History';

  @override
  String get searchHistoryPlaceholder => 'Search past questions';

  @override
  String get today => 'Today';

  @override
  String get yesterday => 'Yesterday';

  @override
  String get noHistoryTitle => 'No Chat History Yet';

  @override
  String get noHistorySubtitle =>
      'Ask the AI Teacher any question by typing or snapping a photo.';

  @override
  String get askAiButton => 'Ask AI Teacher';

  @override
  String get homeworkHelpTitle => 'Homework Help';

  @override
  String get snapQuestionTitle => 'Take a photo of the question';

  @override
  String get snapQuestionSub =>
      'Snap your textbook or notebook to get step-by-step AI guidance.';

  @override
  String get openCamera => 'Open Camera';

  @override
  String get pickFromGallery => 'Pick from Gallery';

  @override
  String get typeQuestionAction => 'Type Question';

  @override
  String get bestResultsTitle => 'For Best Results';

  @override
  String get tip1 => 'Take a clear, sharp photo';

  @override
  String get tip2 => 'Include the full question';

  @override
  String get tip3 => 'Use sufficient lighting';

  @override
  String get privacyNote => 'Your photo is used solely for question analysis.';

  @override
  String get reviewImageTitle => 'Review Photo';

  @override
  String uploadingProgress(Object percent) {
    return 'Uploading... $percent%';
  }

  @override
  String get isQuestionClear => 'Is the question clearly visible?';

  @override
  String get unclearWarning => 'Blurry text may impact AI accuracy.';

  @override
  String get analyzeQuestion => 'Analyze Question';

  @override
  String get retakePhoto => 'Retake Photo';

  @override
  String get solutionTitle => 'Solution';

  @override
  String get letsTrySelf => 'Let\'s try together.';

  @override
  String get showAnswer => 'Show Answer';

  @override
  String get moreHints => 'More Hints';

  @override
  String get practiceTitle => 'Practice Setup';

  @override
  String get questionCountLabel => 'Number of Questions';

  @override
  String get difficultyLabel => 'Difficulty Level';

  @override
  String get questionTypeLabel => 'Question Type';

  @override
  String get startPractice => 'Start Practice';

  @override
  String questionProgress(Object current, Object total) {
    return 'Question $current / $total';
  }

  @override
  String get wrongAnswer => 'Wrong Answer';

  @override
  String get correctAnswer => 'Correct Answer';

  @override
  String get resultTitle => 'Result';

  @override
  String get greatEffortTitle => 'Great Effort!';

  @override
  String get scoreLabel => 'Score';

  @override
  String get accuracyLabel => 'Accuracy';

  @override
  String get needReviewTitle => 'Needs Review';

  @override
  String get practiceMistakes => 'Practice Mistakes';

  @override
  String get reviewResults => 'Review Results';

  @override
  String get backToHome => 'Back to Home';

  @override
  String get mistakeReviewTitle => 'Mistake Review';

  @override
  String get yourAnswer => 'Your Answer';

  @override
  String get examLibraryTitle => 'Exam Library';

  @override
  String get modelTestTab => 'Model Tests';

  @override
  String get chapterExamTab => 'Chapter Exams';

  @override
  String get boardPrepTab => 'Board Prep';

  @override
  String get startExam => 'Start Exam';

  @override
  String get viewResult => 'View Result';

  @override
  String get higherPrep => 'Higher Preparation';

  @override
  String get studyCalendarTitle => 'Study Calendar';

  @override
  String get examInstructionsTitle => 'Exam Instructions';

  @override
  String get examSessionTitle => 'Exam Session';

  @override
  String get examResultTitle => 'Exam Result';

  @override
  String get submitExam => 'Submit Exam';

  @override
  String get agreeRules => 'I agree to follow all exam rules';

  @override
  String get totalMarks => 'Full Marks: 50';
}
