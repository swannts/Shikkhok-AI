import { Job } from 'bullmq';

export interface AnalyticsJobData {
  studentId: string;
  date?: string;
  studyDurationMinutes?: number;
  practiceQuestionsAttempted?: number;
  practiceQuestionsCorrect?: number;
  streakIncrement?: boolean;
}

export async function processAnalyticsJob(job: Job): Promise<Record<string, any>> {
  const jobName = job.name || job.data?.jobType || 'ANALYTICS_AGGREGATION';
  const data = (job.data?.data || job.data) as AnalyticsJobData;

  console.log(`[AnalyticsProcessor] Aggregating analytics for student: ${data.studentId} (${jobName})`);

  const questionsAttempted = data.practiceQuestionsAttempted || 0;
  const questionsCorrect = data.practiceQuestionsCorrect || 0;
  const accuracyPercentage =
    questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 100;

  const durationMinutes = data.studyDurationMinutes || 15;

  const aggregationResult = {
    studentId: data.studentId,
    date: data.date || new Date().toISOString().split('T')[0],
    totalStudyMinutes: durationMinutes,
    questionsAttempted,
    questionsCorrect,
    accuracyPercentage,
    streakMaintained: true,
    aggregatedAt: new Date().toISOString(),
  };

  console.log(
    `[AnalyticsProcessor] Student ${data.studentId}: ${durationMinutes} mins study, ${accuracyPercentage}% accuracy`,
  );

  return aggregationResult;
}
