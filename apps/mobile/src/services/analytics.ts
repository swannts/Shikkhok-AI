export type AnalyticsEvent =
  | 'app_opened'
  | 'login_completed'
  | 'onboarding_completed'
  | 'subject_opened'
  | 'lesson_started'
  | 'lesson_completed'
  | 'practice_started'
  | 'practice_completed'
  | 'exam_started'
  | 'exam_completed'
  | 'tutor_message_sent'
  | 'tutor_response_completed'
  | 'homework_uploaded'
  | 'study_plan_task_completed';

class AnalyticsService {
  private enabled: boolean = true;

  public track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;
    // Sanitized analytics logger (never log PII, messages, or tokens)
    if (__DEV__) {
      console.log(`[Analytics Track] ${event}:`, properties || {});
    }
  }

  public screen(screenName: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;
    if (__DEV__) {
      console.log(`[Analytics Screen] View: ${screenName}`, properties || {});
    }
  }
}

export const analytics = new AnalyticsService();
