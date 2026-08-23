export interface StudentStudyContext {
  studentClass: string;          // e.g. 'class-8'
  availableStudyMinutes: number; // e.g. 60
  examGoal: 'exam_prep' | 'concept_mastery' | 'quick_revision';
  weakTopics: Array<{ id: string; title: string; subject: string; accuracy: number }>;
  unfinishedLessons: Array<{ id: string; title: string; subject: string; estimatedMinutes: number }>;
  subjectMastery: Record<string, number>; // e.g. { math: 65, science: 80, english: 45 }
}

export interface GeneratedTask {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  completed: boolean;
  priorityReason: string;
}

export interface GeneratedStudyPlan {
  date: string;
  totalAvailableMinutes: number;
  allocatedMinutes: number;
  completedCount: number;
  totalCount: number;
  tasks: GeneratedTask[];
  aiPersonalizedExplanation?: string;
}

export class StudyPlanEngine {
  /**
   * Deterministically calculates and schedules daily tasks based on student inputs.
   * Priority strategy:
   *  1. Weak topics (<50% accuracy) get highest priority practice task.
   *  2. Lowest mastery subject gets revision/practice task.
   *  3. Unfinished lessons fit within remaining time budget.
   */
  public generateDeterministicPlan(context: StudentStudyContext): GeneratedStudyPlan {
    const tasks: GeneratedTask[] = [];
    let remainingMinutes = context.availableStudyMinutes;
    let taskIdCounter = 1;

    // Priority 1: Address urgent weak topics
    for (const weakTopic of context.weakTopics) {
      const taskDuration = 15;
      if (remainingMinutes >= taskDuration) {
        tasks.push({
          id: `task-${taskIdCounter++}`,
          title: `${weakTopic.title} সংক্রান্ত প্র্যাকটিস ও দুর্বলতা নিরসন`,
          subject: weakTopic.subject,
          durationMinutes: taskDuration,
          completed: false,
          priorityReason: `Weak Topic (${weakTopic.accuracy}% accuracy)`,
        });
        remainingMinutes -= taskDuration;
      }
    }

    // Priority 2: Address subject with lowest mastery score
    const lowestMasteryEntry = Object.entries(context.subjectMastery).sort(
      ([, masteryA], [, masteryB]) => masteryA - masteryB
    )[0];

    if (lowestMasteryEntry && remainingMinutes >= 20) {
      const [subjectId, masteryValue] = lowestMasteryEntry;
      const subjectNameMap: Record<string, string> = {
        math: 'গণিত',
        science: 'বিজ্ঞান',
        english: 'ইংরেজি',
      };
      const subjectName = subjectNameMap[subjectId] || subjectId;

      tasks.push({
        id: `task-${taskIdCounter++}`,
        title: `${subjectName} বিষয়ে রিভিশন এবং স্পেশাল প্র্যাকটিস`,
        subject: subjectName,
        durationMinutes: 20,
        completed: false,
        priorityReason: `Lowest Subject Mastery (${masteryValue}%)`,
      });
      remainingMinutes -= 20;
    }

    // Priority 3: Schedule unfinished lessons fitting into remaining budget
    for (const lesson of context.unfinishedLessons) {
      const duration = lesson.estimatedMinutes || 20;
      if (remainingMinutes >= duration) {
        tasks.push({
          id: `task-${taskIdCounter++}`,
          title: `${lesson.title} পাঠ সম্পন্ন করা`,
          subject: lesson.subject,
          durationMinutes: duration,
          completed: false,
          priorityReason: `Unfinished Lesson`,
        });
        remainingMinutes -= duration;
      }
    }

    const allocatedMinutes = context.availableStudyMinutes - remainingMinutes;

    return {
      date: 'আজ, ' + new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' }),
      totalAvailableMinutes: context.availableStudyMinutes,
      allocatedMinutes,
      completedCount: 0,
      totalCount: tasks.length,
      tasks,
    };
  }

  /**
   * Optional AI layer to generate personalized explanatory encouragement on top of the deterministic schedule.
   */
  public attachAiExplanation(plan: GeneratedStudyPlan, context: StudentStudyContext): GeneratedStudyPlan {
    const weakCount = context.weakTopics.length;
    const goalText =
      context.examGoal === 'exam_prep'
        ? 'পরীক্ষার প্রস্তুতি'
        : context.examGoal === 'concept_mastery'
        ? 'ধারণা স্পষ্টকরণ'
        : 'দ্রুত রিভিশন';

    const aiMessage =
      `আপনার ${goalText} লক্ষ্য এবং আজকের ${context.availableStudyMinutes} মিনিট সময় বিবেচনা করে এই রুটিন তৈরি করা হয়েছে। ` +
      (weakCount > 0
        ? `বিশেষভাবে আপনার ${weakCount}টি দুর্বল বিষয়ের ওপর অগ্রাধিকার দেওয়া হয়েছে।`
        : `আপনার বিষয়ভিত্তিক পড়া সমান গতিতে এগিয়ে নেওয়ার জন্য টাস্ক সাজানো হয়েছে।`);

    return {
      ...plan,
      aiPersonalizedExplanation: aiMessage,
    };
  }
}

export const studyPlanEngine = new StudyPlanEngine();
