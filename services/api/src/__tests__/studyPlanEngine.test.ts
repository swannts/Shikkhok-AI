import { studyPlanEngine, StudentStudyContext } from '../modules/studyPlan/studyPlan.engine';

describe('StudyPlanEngine (Deterministic Scheduling)', () => {
  const sampleContext: StudentStudyContext = {
    studentClass: 'class-8',
    availableStudyMinutes: 60,
    examGoal: 'exam_prep',
    weakTopics: [
      { id: 'wt1', title: 'ভগ্নাংশের সমীকরণ সমাধান', subject: 'গণিত', accuracy: 45 },
    ],
    unfinishedLessons: [
      { id: 'l1', title: 'সালোকসংশ্লেষণ অধ্যায়', subject: 'বিজ্ঞান', estimatedMinutes: 20 },
      { id: 'l2', title: 'Right Forms of Verbs', subject: 'ইংরেজি', estimatedMinutes: 25 },
    ],
    subjectMastery: {
      math: 45,
      science: 70,
      english: 80,
    },
  };

  it('prioritizes weak topics first', () => {
    const plan = studyPlanEngine.generateDeterministicPlan(sampleContext);
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.tasks[0].priorityReason).toContain('Weak Topic');
    expect(plan.tasks[0].subject).toBe('গণিত');
  });

  it('allocates tasks within available study time budget', () => {
    const plan = studyPlanEngine.generateDeterministicPlan(sampleContext);
    expect(plan.allocatedMinutes).toBeLessThanOrEqual(sampleContext.availableStudyMinutes);
  });

  it('attaches AI personalized explanation without mutating core scheduled tasks', () => {
    const plan = studyPlanEngine.generateDeterministicPlan(sampleContext);
    const planWithAi = studyPlanEngine.attachAiExplanation(plan, sampleContext);

    expect(planWithAi.tasks).toEqual(plan.tasks);
    expect(planWithAi.aiPersonalizedExplanation).toBeDefined();
    expect(planWithAi.aiPersonalizedExplanation).toContain('পরীক্ষার প্রস্তুতি');
  });
});
