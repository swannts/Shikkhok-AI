import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { QueryProvider } from './src/providers/QueryProvider';
import { colors, spacing, typography } from './src/theme';

import { HomeScreen } from './src/features/home/HomeScreen';
import { LearnScreen } from './src/features/curriculum/LearnScreen';
import { SubjectScreen } from './src/features/curriculum/SubjectScreen';
import { LessonScreen } from './src/features/lessons/LessonScreen';
import { TutorScreen } from './src/features/tutor/TutorScreen';
import { ProgressScreen } from './src/features/progress/ProgressScreen';
import { PracticeSessionScreen } from './src/features/practice/PracticeSessionScreen';
import { PracticeResultScreen } from './src/features/practice/PracticeResultScreen';
import { HomeworkScreen } from './src/features/homework/HomeworkScreen';
import { ExamSessionScreen } from './src/features/exams/ExamSessionScreen';
import { StudyPlanScreen } from './src/features/study-plan/StudyPlanScreen';
import { ProfileScreen } from './src/features/profile/ProfileScreen';
import { LoginFeatureScreen } from './src/features/auth/LoginFeatureScreen';
import { OnboardingFlowScreen } from './src/features/onboarding/OnboardingFlowScreen';

import {
  SplashScreen,
  SignupScreen,
  OTPVerificationScreen,
  DesignSystemScreen,
  ChatHistoryScreen,
  VoiceTutorScreen,
  PracticeSetupScreen,
  ParentDashboardScreen,
  SubscriptionScreen,
  PaymentScreen,
  PaymentSuccessScreen,
  NotificationsScreen,
  SearchScreen,
  DownloadsScreen,
  AIFeedbackScreen,
} from './src/screens';
import { PracticeResultData } from './src/api/repositories/practiceRepository';
import { ExamResult } from './src/api/repositories/examRepository';

export type ScreenName =
  | 'home'
  | 'learn'
  | 'subject'
  | 'lesson'
  | 'tutor'
  | 'progress'
  | 'practice_session'
  | 'practice_result'
  | 'homework'
  | 'exam_session'
  | 'study_plan'
  | 'profile'
  | 'login_feature'
  | 'onboarding_flow'
  | 'practice_setup'
  | 'voice_tutor'
  | 'parent_dashboard'
  | 'subscription'
  | 'payment'
  | 'payment_success'
  | 'notifications'
  | 'search'
  | 'downloads'
  | 'ai_feedback'
  | 'splash'
  | 'design_system';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('math');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('linear-equations');
  const [tutorPrompt, setTutorPrompt] = useState<string | undefined>(undefined);
  const [practiceResult, setPracticeResult] = useState<PracticeResultData | null>(null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const screens: { name: ScreenName; title: string }[] = [
    { name: 'home', title: '1. Home Dashboard' },
    { name: 'learn', title: '2. Learn (বিষয়সমূহ)' },
    { name: 'subject', title: '3. Subject Details (গণিত)' },
    { name: 'lesson', title: '4. Lesson (সরল সমীকরণ)' },
    { name: 'tutor', title: '5. AI Tutor (কথোপকথন)' },
    { name: 'practice_session', title: '6. Practice Session (MCQ Quiz)' },
    { name: 'practice_result', title: '7. Practice Result & Mastery' },
    { name: 'homework', title: '8. Homework Help (ক্যামেরা/গ্যালারি)' },
    { name: 'exam_session', title: '9. Exam Session (মডেল টেস্ট)' },
    { name: 'study_plan', title: '10. Study Plan (আজকের প্ল্যান)' },
    { name: 'progress', title: '11. Progress Tracking' },
    { name: 'profile', title: '12. Profile & Language Switcher' },
    { name: 'login_feature', title: '13. Login (React Hook Form + Zod)' },
    { name: 'onboarding_flow', title: '14. Onboarding Flow (3 Steps)' },
    { name: 'voice_tutor', title: '15. Voice Tutor' },
    { name: 'parent_dashboard', title: '16. Parent Dashboard' },
    { name: 'subscription', title: '17. Subscription' },
    { name: 'payment', title: '18. Payment' },
    { name: 'payment_success', title: '19. Payment Success' },
    { name: 'notifications', title: '20. Notifications' },
    { name: 'search', title: '21. Search' },
    { name: 'downloads', title: '22. Downloads' },
    { name: 'ai_feedback', title: '23. AI Feedback' },
    { name: 'design_system', title: '24. Design Tokens' },
  ];

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'learn':
        return (
          <LearnScreen
            onSelectSubject={(subjectId) => {
              setSelectedSubjectId(subjectId);
              setCurrentScreen('subject');
            }}
          />
        );
      case 'subject':
        return (
          <SubjectScreen
            subjectId={selectedSubjectId}
            onBack={() => setCurrentScreen('learn')}
            onSelectChapter={() => {
              setSelectedLessonId('linear-equations');
              setCurrentScreen('lesson');
            }}
          />
        );
      case 'lesson':
        return (
          <LessonScreen
            lessonId={selectedLessonId}
            onBack={() => setCurrentScreen('subject')}
            onAskTutor={(prompt) => {
              setTutorPrompt(prompt);
              setCurrentScreen('tutor');
            }}
          />
        );
      case 'tutor':
        return (
          <TutorScreen initialPrompt={tutorPrompt} onBack={() => setCurrentScreen('lesson')} />
        );
      case 'practice_session':
        return (
          <PracticeSessionScreen
            onComplete={(answers, timeSpent) => {
              setPracticeResult({
                sessionId: 'session-1',
                correctAnswers: 4,
                totalQuestions: 5,
                accuracyPercentage: 80,
                timeSpentSeconds: timeSpent,
                initialMastery: 42,
                updatedMastery: 58,
                weakTopics: ['ভগ্নাংশের সমীকরণ'],
              });
              setCurrentScreen('practice_result');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'practice_result':
        return practiceResult ? (
          <PracticeResultScreen
            result={practiceResult}
            onGoHome={() => setCurrentScreen('home')}
            onRetryWeak={() => setCurrentScreen('practice_session')}
          />
        ) : (
          <HomeScreen
            onNavigateLearn={() => setCurrentScreen('learn')}
            onOpenSubject={(id) => {
              setSelectedSubjectId(id);
              setCurrentScreen('subject');
            }}
            onOpenLesson={(id) => {
              setSelectedLessonId(id);
              setCurrentScreen('lesson');
            }}
            onOpenTutor={() => setCurrentScreen('tutor')}
            onOpenProgress={() => setCurrentScreen('progress')}
          />
        );
      case 'homework':
        return (
          <HomeworkScreen
            onAskTutorWithQuery={(query) => {
              setTutorPrompt(query);
              setCurrentScreen('tutor');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'exam_session':
        return (
          <ExamSessionScreen
            onFinishExam={() => setCurrentScreen('home')}
            onCancel={() => setCurrentScreen('home')}
          />
        );
      case 'study_plan':
        return (
          <StudyPlanScreen
            onBack={() => setCurrentScreen('home')}
            onOpenLesson={() => setCurrentScreen('lesson')}
          />
        );
      case 'progress':
        return (
          <ProgressScreen
            onBack={() => setCurrentScreen('home')}
            onPracticeTopic={() => {
              setSelectedLessonId('linear-equations');
              setCurrentScreen('lesson');
            }}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onOpenParentDashboard={() => setCurrentScreen('parent_dashboard')}
            onOpenSubscription={() => setCurrentScreen('subscription')}
            onOpenNotifications={() => setCurrentScreen('notifications')}
            onOpenDownloads={() => setCurrentScreen('downloads')}
            onLogout={() => setCurrentScreen('login_feature')}
          />
        );
      case 'login_feature':
        return (
          <LoginFeatureScreen
            onSuccess={() => setCurrentScreen('home')}
            onGoSignup={() => setCurrentScreen('onboarding_flow')}
            onGoOTP={() => setCurrentScreen('home')}
          />
        );
      case 'onboarding_flow':
        return <OnboardingFlowScreen onFinish={() => setCurrentScreen('home')} />;
      case 'practice_setup':
        return (
          <PracticeSetupScreen
            onStart={() => setCurrentScreen('practice_session')}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'voice_tutor':
        return <VoiceTutorScreen onBack={() => setCurrentScreen('tutor')} />;
      case 'parent_dashboard':
        return <ParentDashboardScreen onBack={() => setCurrentScreen('profile')} />;
      case 'subscription':
        return (
          <SubscriptionScreen
            onSelectPlan={() => setCurrentScreen('payment')}
            onBack={() => setCurrentScreen('profile')}
          />
        );
      case 'payment':
        return (
          <PaymentScreen
            onPaySuccess={() => setCurrentScreen('payment_success')}
            onBack={() => setCurrentScreen('subscription')}
          />
        );
      case 'payment_success':
        return <PaymentSuccessScreen onGoHome={() => setCurrentScreen('home')} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => setCurrentScreen('profile')} />;
      case 'search':
        return <SearchScreen onBack={() => setCurrentScreen('home')} />;
      case 'downloads':
        return <DownloadsScreen onBack={() => setCurrentScreen('profile')} />;
      case 'ai_feedback':
        return <AIFeedbackScreen onBack={() => setCurrentScreen('home')} />;
      case 'splash':
        return <SplashScreen onFinish={() => setCurrentScreen('onboarding_flow')} />;
      case 'design_system':
        return <DesignSystemScreen />;
      case 'home':
      default:
        return (
          <HomeScreen
            onNavigateLearn={() => setCurrentScreen('learn')}
            onOpenSubject={(subjectId) => {
              setSelectedSubjectId(subjectId);
              setCurrentScreen('subject');
            }}
            onOpenLesson={(lessonId) => {
              setSelectedLessonId(lessonId);
              setCurrentScreen('lesson');
            }}
            onOpenTutor={() => setCurrentScreen('tutor')}
            onOpenProgress={() => setCurrentScreen('progress')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.screenWrapper}>{renderCurrentScreen()}</View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setShowDemoSelector(!showDemoSelector)}
        style={styles.floatingPill}
      >
        <Text style={styles.pillText}>📱 View Screen ({currentScreen})</Text>
      </TouchableOpacity>

      {showDemoSelector && (
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>All Production App Features</Text>
              <TouchableOpacity onPress={() => setShowDemoSelector(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerList}>
              {screens.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => {
                    setCurrentScreen(item.name);
                    setShowDemoSelector(false);
                  }}
                  style={[
                    styles.drawerItem,
                    currentScreen === item.name ? styles.drawerItemActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.drawerItemText,
                      currentScreen === item.name ? styles.drawerItemTextActive : null,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screenWrapper: { flex: 1 },
  floatingPill: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: colors.onSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    elevation: 6,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  pillText: { color: colors.white, fontSize: typography.size.xs, fontWeight: '700' },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  drawerContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    maxHeight: '70%',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  drawerTitle: { fontSize: typography.size.md, fontWeight: '800', color: colors.onSurface },
  closeText: { fontSize: typography.size.lg, color: colors.outline },
  drawerList: { marginBottom: spacing.md },
  drawerItem: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
  },
  drawerItemActive: { backgroundColor: colors.primary },
  drawerItemText: { fontSize: typography.size.sm, color: colors.onSurface, fontWeight: '600' },
  drawerItemTextActive: { color: colors.white, fontWeight: '700' },
});
