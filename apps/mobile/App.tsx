import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from './src/theme';
import {
  SplashScreen,
  OnboardingScreen,
  LoginScreen,
  SignupScreen,
  OTPVerificationScreen,
  StudentSetupScreen,
  HomeScreen,
  LessonScreen,
  PracticeScreen,
  DesignSystemScreen,
  SubjectDetailsScreen,
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
import { TabKey } from './src/components';

export type ScreenName =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'signup'
  | 'otp'
  | 'setup'
  | 'home'
  | 'lesson'
  | 'practice'
  | 'design_system'
  | 'subject_details'
  | 'chat_history'
  | 'voice_tutor'
  | 'practice_setup'
  | 'parent_dashboard'
  | 'subscription'
  | 'payment'
  | 'payment_success'
  | 'notifications'
  | 'search'
  | 'downloads'
  | 'ai_feedback';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const screens: { name: ScreenName; title: string }[] = [
    { name: 'home', title: '1. Home (হোম)' },
    { name: 'lesson', title: '2. Lesson (পড়াশোনা)' },
    { name: 'practice', title: '3. Practice (প্র্যাকটিস হাব)' },
    { name: 'subject_details', title: '4. Subject Details (গণিত বিস্তারিত)' },
    { name: 'chat_history', title: '5. Chat History (আগের আলোচনা)' },
    { name: 'voice_tutor', title: '6. Voice Tutor (AI ভয়েস টিউটর)' },
    { name: 'practice_setup', title: '7. Practice Setup (প্র্যাকটিস সেটাআপ)' },
    { name: 'parent_dashboard', title: '8. Parent Dashboard (অভিভাবক)' },
    { name: 'subscription', title: '9. Subscription (সাবস্ক্রিপশন)' },
    { name: 'payment', title: '10. Payment (পেমেন্ট)' },
    { name: 'payment_success', title: '11. Payment Success (পেমেন্ট সফল)' },
    { name: 'notifications', title: '12. Notifications (নোটিফিকেশন)' },
    { name: 'search', title: '13. Search (অনুসন্ধান)' },
    { name: 'downloads', title: '14. Downloads (ডাউনলোড)' },
    { name: 'ai_feedback', title: '15. AI Feedback (রিপোর্ট ও মতামত)' },
    { name: 'setup', title: '16. Student Setup (ক্লাস সেটআপ)' },
    { name: 'signup', title: '17. Sign Up' },
    { name: 'onboarding', title: '18. Onboarding' },
    { name: 'splash', title: '19. Splash Screen' },
    { name: 'login', title: '20. Login' },
    { name: 'otp', title: '21. OTP Verification' },
    { name: 'design_system', title: '22. Design System Tokens' },
  ];

  const handleTabNavigation = (tab: TabKey) => {
    switch (tab) {
      case 'home':
        setCurrentScreen('home');
        break;
      case 'lesson':
        setCurrentScreen('lesson');
        break;
      case 'practice':
        setCurrentScreen('practice');
        break;
      case 'profile':
        setCurrentScreen('parent_dashboard');
        break;
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onFinish={() => setCurrentScreen('onboarding')} />;
      case 'onboarding':
        return <OnboardingScreen onStart={() => setCurrentScreen('setup')} onLogin={() => setCurrentScreen('login')} />;
      case 'login':
        return <LoginScreen onLogin={() => setCurrentScreen('home')} onSignup={() => setCurrentScreen('signup')} onForgotPassword={() => setCurrentScreen('otp')} />;
      case 'signup':
        return <SignupScreen onSignupSubmit={() => setCurrentScreen('otp')} onLogin={() => setCurrentScreen('login')} />;
      case 'otp':
        return <OTPVerificationScreen onVerify={() => setCurrentScreen('setup')} onBack={() => setCurrentScreen('signup')} />;
      case 'setup':
        return <StudentSetupScreen onContinue={() => setCurrentScreen('home')} onBack={() => setCurrentScreen('onboarding')} />;
      case 'lesson':
        return <LessonScreen onBack={() => setCurrentScreen('home')} onAskAI={() => setCurrentScreen('voice_tutor')} />;
      case 'practice':
        return <PracticeScreen onNavigateTab={handleTabNavigation} onStartQuiz={() => setCurrentScreen('practice_setup')} />;
      case 'subject_details':
        return <SubjectDetailsScreen onBack={() => setCurrentScreen('home')} onSelectChapter={() => setCurrentScreen('lesson')} />;
      case 'chat_history':
        return <ChatHistoryScreen onBack={() => setCurrentScreen('home')} onSelectChat={() => setCurrentScreen('lesson')} />;
      case 'voice_tutor':
        return <VoiceTutorScreen onBack={() => setCurrentScreen('lesson')} />;
      case 'practice_setup':
        return <PracticeSetupScreen onStart={() => setCurrentScreen('practice')} onBack={() => setCurrentScreen('practice')} />;
      case 'parent_dashboard':
        return <ParentDashboardScreen onBack={() => setCurrentScreen('home')} />;
      case 'subscription':
        return <SubscriptionScreen onSelectPlan={() => setCurrentScreen('payment')} onBack={() => setCurrentScreen('home')} />;
      case 'payment':
        return <PaymentScreen onPaySuccess={() => setCurrentScreen('payment_success')} onBack={() => setCurrentScreen('subscription')} />;
      case 'payment_success':
        return <PaymentSuccessScreen onGoHome={() => setCurrentScreen('home')} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => setCurrentScreen('home')} />;
      case 'search':
        return <SearchScreen onBack={() => setCurrentScreen('home')} />;
      case 'downloads':
        return <DownloadsScreen onBack={() => setCurrentScreen('home')} />;
      case 'ai_feedback':
        return <AIFeedbackScreen onBack={() => setCurrentScreen('home')} />;
      case 'design_system':
        return <DesignSystemScreen />;
      case 'home':
      default:
        return (
          <HomeScreen
            onNavigateTab={handleTabNavigation}
            onOpenLesson={() => setCurrentScreen('subject_details')}
            onOpenPractice={() => setCurrentScreen('practice')}
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
        <Text style={styles.pillText}>📱 Switch ({currentScreen})</Text>
      </TouchableOpacity>

      {showDemoSelector && (
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>All 22 Stitch Screens</Text>
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
    borderRadius: spacing.borderRadius.full,
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
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    padding: spacing.md,
    maxHeight: '70%',
  },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  drawerTitle: { fontSize: typography.size.md, fontWeight: '800', color: colors.onSurface },
  closeText: { fontSize: typography.size.lg, color: colors.outline },
  drawerList: { marginBottom: spacing.md },
  drawerItem: { paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: spacing.borderRadius.md, marginBottom: spacing.xs, backgroundColor: colors.surfaceContainerLow },
  drawerItemActive: { backgroundColor: colors.primary },
  drawerItemText: { fontSize: typography.size.sm, color: colors.onSurface, fontWeight: '600' },
  drawerItemTextActive: { color: colors.white, fontWeight: '700' },
});
