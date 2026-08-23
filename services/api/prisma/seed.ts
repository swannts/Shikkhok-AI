import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Safety Guard: Prevent accidental execution in production environments
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    console.error('❌ SAFETY GUARD TRIGGERED: Seed scripts must NEVER run in production or staging environments!');
    process.exit(1);
  }

  console.log('🌱 Starting Shikkhok AI Development Database Seed...');

  // 1. Seed Curriculum Classes
  const class6 = await prisma.class.upsert({
    where: { id: 'class-6' },
    update: {},
    create: {
      id: 'class-6',
      gradeNumber: 6,
      bnTitle: 'ষষ্ঠ শ্রেণি',
      enTitle: 'Class 6',
    },
  });

  const class8 = await prisma.class.upsert({
    where: { id: 'class-8' },
    update: {},
    create: {
      id: 'class-8',
      gradeNumber: 8,
      bnTitle: 'অষ্টম শ্রেণি',
      enTitle: 'Class 8',
    },
  });

  // 2. Seed Subjects
  const mathSubject = await prisma.subject.upsert({
    where: { id: 'class-8-math' },
    update: {},
    create: {
      id: 'class-8-math',
      classId: class8.id,
      bnName: 'গণিত',
      enName: 'Mathematics',
      icon: '📐',
      chapterCount: 10,
      lessonCount: 42,
      colorBg: '#EEF2FF',
    },
  });

  const scienceSubject = await prisma.subject.upsert({
    where: { id: 'class-8-science' },
    update: {},
    create: {
      id: 'class-8-science',
      classId: class8.id,
      bnName: 'বিজ্ঞান',
      enName: 'General Science',
      icon: '🔬',
      chapterCount: 8,
      lessonCount: 36,
      colorBg: '#ECFDF5',
    },
  });

  // 3. Seed Chapters
  const chapter1 = await prisma.chapter.upsert({
    where: { id: 'c8-math-ch4' },
    update: {},
    create: {
      id: 'c8-math-ch4',
      subjectId: mathSubject.id,
      chapterNumber: 4,
      bnTitle: 'বীজগাণিতীয় সূত্রাবলী ও প্রয়োগ',
      enTitle: 'Algebraic Formulae & Applications',
      lessonCount: 4,
      practiceSetCount: 2,
    },
  });

  // 4. Seed Lessons
  const lesson1 = await prisma.lesson.upsert({
    where: { id: 'c8-math-ch4-l1' },
    update: {},
    create: {
      id: 'c8-math-ch4-l1',
      chapterId: chapter1.id,
      title: 'সরল সমীকরণ গঠন ও সমাধান',
      estimatedMinutes: 15,
      blocks: [
        {
          type: 'text',
          content: 'দুইটি বীজগাণিতীয় রাশি সমান চিহ্ন দ্বারা যুক্ত হলে তাকে সমীকরণ বলে।',
        },
      ],
    },
  });

  // 5. Seed Practice Questions
  await prisma.question.upsert({
    where: { id: 'q-seed-1' },
    update: {},
    create: {
      id: 'q-seed-1',
      topicId: 'linear-equations',
      type: 'MCQ',
      questionText: '$2x + 4 = 12$ হলে $x$ এর মান কত?',
      options: [
        { id: 'opt1', text: '3' },
        { id: 'opt2', text: '4' },
        { id: 'opt3', text: '5' },
        { id: 'opt4', text: '6' },
      ],
      answerConfig: { correctOptionId: 'opt2' },
      explanation: '$2x = 12 - 4 \\Rightarrow 2x = 8 \\Rightarrow x = 4$',
    },
  });

  // 6. Seed Test Student Profile
  const testUser = await prisma.user.upsert({
    where: { email: 'student.test@shikkhok.ai' },
    update: {},
    create: {
      email: 'student.test@shikkhok.ai',
      phone: '01700000000',
      passwordHash: 'seeded_password_hash',
      role: 'STUDENT',
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      class: 'Class 8',
      medium: 'bangla',
      schoolName: 'Dhaka Residential Model College',
      district: 'Dhaka',
      dailyGoalMinutes: 30,
    },
  });

  console.log('✅ Shikkhok AI Seed Data successfully populated.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
