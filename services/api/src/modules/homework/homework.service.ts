import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { StudentsService } from '../students/students.service';
import { CurriculumService } from '../curriculum/curriculum.service';
import { HomeworkSubmissionRepository } from './repositories/homework-submission.repository';
import { HomeworkFeedbackRepository } from './repositories/homework-feedback.repository';
import { HomeworkStatus } from './enums/homework-status.enum';
import { CreateHomeworkSubmissionDto } from './dto/create-homework-submission.dto';
import { RateHomeworkFeedbackDto } from './dto/rate-homework-feedback.dto';
import { ListHomeworkQueryDto } from './dto/list-homework-query.dto';
import { ConfigService } from '@nestjs/config';
import { TutorCitation } from '../tutor/types/tutor-citation.type';
import { AiGatewayService } from '../ai-gateway/services/ai-gateway.service';

@Injectable()
export class HomeworkService {
  private readonly logger = new Logger(HomeworkService.name);

  constructor(
    private readonly submissionRepository: HomeworkSubmissionRepository,
    private readonly feedbackRepository: HomeworkFeedbackRepository,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly curriculumService: CurriculumService,
    @Optional() @InjectQueue('homework') private readonly homeworkQueue?: Queue,
    @Optional() private readonly aiGatewayService?: AiGatewayService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  async createSubmission(
    currentUser: AuthenticatedUser,
    dto: CreateHomeworkSubmissionDto,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    const submission = await this.submissionRepository.createSubmission({
      studentId: currentUser.userId,
      imageUrls: dto.imageUrls,
      prompt: dto.prompt,
      subjectId: dto.subjectId,
      chapterId: dto.chapterId,
      lessonId: dto.lessonId,
    });

    const submissionId = submission._id.toString();

    // Dispatch async job or process immediately
    if (this.homeworkQueue) {
      try {
        await this.homeworkQueue.add(
          'process-homework',
          { submissionId },
          {
            jobId: `process-homework-${submissionId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );
      } catch (queueErr) {
        this.logger.warn(`Failed to enqueue homework job, running inline: ${queueErr}`);
        void this.processSubmission(submissionId);
      }
    } else {
      void this.processSubmission(submissionId);
    }

    return submission.toJSON();
  }

  async getMySubmissions(
    currentUser: AuthenticatedUser,
    query: ListHomeworkQueryDto,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const result = await this.submissionRepository.findByStudentId(currentUser.userId, {
      status: query.status,
      limit,
      offset,
    });

    return {
      data: result.data.map((sub) => sub.toJSON()),
      meta: {
        total: result.total,
        limit,
        offset,
        hasNext: offset + limit < result.total,
      },
    };
  }

  async getSubmission(
    currentUser: AuthenticatedUser,
    submissionId: string,
  ): Promise<Record<string, any>> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Homework submission not found');
    }

    await this.assertOwnershipOrAdmin(currentUser, submission.studentId.toString());

    return submission.toJSON();
  }

  async getFeedback(
    currentUser: AuthenticatedUser,
    submissionId: string,
  ): Promise<Record<string, any>> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Homework submission not found');
    }

    await this.assertOwnershipOrAdmin(currentUser, submission.studentId.toString());

    if (
      submission.status === HomeworkStatus.PENDING ||
      submission.status === HomeworkStatus.PROCESSING
    ) {
      throw new BadRequestException(
        'Homework is still being processed. Please check back shortly.',
      );
    }

    if (submission.status === HomeworkStatus.FAILED) {
      throw new BadRequestException(
        `Homework processing failed: ${submission.errorMessage ?? 'Unknown error'}`,
      );
    }

    const feedback = await this.feedbackRepository.findBySubmissionId(submissionId);
    if (!feedback) {
      throw new NotFoundException('Feedback not found for this submission');
    }

    return feedback.toJSON();
  }

  async rateFeedback(
    currentUser: AuthenticatedUser,
    submissionId: string,
    dto: RateHomeworkFeedbackDto,
  ): Promise<Record<string, any>> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Homework submission not found');
    }

    await this.assertOwnershipOrAdmin(currentUser, submission.studentId.toString());

    const updated = await this.feedbackRepository.setRating(submissionId, dto.rating);
    if (!updated) {
      throw new NotFoundException('Feedback not found to rate');
    }

    return updated.toJSON();
  }

  async retrySubmission(
    currentUser: AuthenticatedUser,
    submissionId: string,
  ): Promise<Record<string, any>> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Homework submission not found');
    }

    await this.assertOwnershipOrAdmin(currentUser, submission.studentId.toString());

    if (submission.status === HomeworkStatus.COMPLETED) {
      throw new BadRequestException('Submission is already completed');
    }

    await this.submissionRepository.updateStatus(submissionId, HomeworkStatus.PENDING);
    void this.processSubmission(submissionId);

    return { message: 'Homework processing re-triggered', submissionId };
  }

  async processSubmission(submissionId: string): Promise<void> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      this.logger.warn(`Cannot process missing homework submission: ${submissionId}`);
      return;
    }

    await this.submissionRepository.updateStatus(submissionId, HomeworkStatus.PROCESSING);

    try {
      const aiServiceEnabled = this.configService?.get<boolean>('aiService.enabled', false);
      if (!aiServiceEnabled || !this.aiGatewayService) {
        await this.submissionRepository.updateStatus(submissionId, HomeworkStatus.FAILED, {
          errorMessage: 'AI মূল্যায়ন সেবা এখন পাওয়া যাচ্ছে না। ইন্টারনেট এলে আবার চেষ্টা করো।',
        });
        return;
      }

      let studentProfile: Record<string, any> | undefined;
      try {
        studentProfile = await this.studentsService.getProfileByUserId(
          submission.studentId.toString(),
        );
      } catch (profileError) {
        this.logger.warn(
          `Student curriculum scope is unavailable for homework ${submissionId}: ${profileError instanceof Error ? profileError.message : 'unknown error'}`,
        );
      }

      let subjectTitle: string | undefined;
      let chapterTitle: string | undefined;
      let lessonTitle: string | undefined;
      if (submission.lessonId) {
        try {
          const lesson = await this.curriculumService.getLesson(submission.lessonId.toString());
          const chapter = submission.chapterId
            ? await this.curriculumService.getChapter(submission.chapterId.toString())
            : null;
          const subject = submission.subjectId
            ? await this.curriculumService.getSubject(submission.subjectId.toString())
            : null;
          subjectTitle = subject?.name;
          chapterTitle = chapter?.title;
          lessonTitle = lesson?.title;
        } catch (contextError) {
          this.logger.warn(
            `Could not load homework curriculum context for ${submissionId}: ${contextError instanceof Error ? contextError.message : 'unknown error'}`,
          );
        }
      }

      const aiResponse = await this.aiGatewayService.evaluateHomework({
        submission_id: submissionId,
        student_id: submission.studentId.toString(),
        raw_text: submission.rawText?.trim() || undefined,
        prompt: submission.prompt,
        image_urls: submission.imageUrls ?? [],
        class_level:
          typeof studentProfile?.classLevel === 'number' ? studentProfile.classLevel : undefined,
        curriculum_year:
          typeof studentProfile?.curriculumYear === 'number'
            ? studentProfile.curriculumYear
            : undefined,
        medium:
          studentProfile?.medium === 'bangla' || studentProfile?.medium === 'english'
            ? studentProfile.medium
            : undefined,
        subject_id: submission.subjectId?.toString(),
        chapter_id: submission.chapterId?.toString(),
        lesson_id: submission.lessonId?.toString(),
        subject_title: subjectTitle,
        chapter_title: chapterTitle,
        lesson_title: lessonTitle,
      });

      if (!aiResponse || aiResponse.evaluation_available === false) {
        throw new Error('Homework content could not be evaluated from available evidence');
      }

      const summary = typeof aiResponse.summary === 'string' ? aiResponse.summary.trim() : '';
      if (!summary) throw new Error('AI evaluation response did not include a valid summary');

      const citations: TutorCitation[] = [];
      if (Array.isArray(aiResponse.citations)) {
        for (const citation of aiResponse.citations) {
          const sourceId = citation.sourceId ?? citation.source_id;
          const sourceBook = citation.sourceBook ?? citation.source_book;
          const excerpt = citation.excerpt ?? citation.textChunk ?? citation.text_chunk;
          if (
            typeof sourceId !== 'string' ||
            !sourceId.trim() ||
            typeof sourceBook !== 'string' ||
            !sourceBook.trim() ||
            typeof excerpt !== 'string' ||
            !excerpt.trim()
          ) {
            continue;
          }
          const pageNumber = citation.pageStart ?? citation.page_start ?? citation.pageNumber;
          citations.push({
            sourceId,
            sourceBook,
            subject: typeof citation.subject === 'string' ? citation.subject : undefined,
            chapter: typeof citation.chapter === 'string' ? citation.chapter : undefined,
            pageNumber: typeof pageNumber === 'number' ? pageNumber : undefined,
            excerpt,
          });
        }
      }

      await this.feedbackRepository.createFeedback({
        submissionId,
        studentId: submission.studentId.toString(),
        summary,
        corrections: Array.isArray(aiResponse.corrections) ? aiResponse.corrections : [],
        strengths: Array.isArray(aiResponse.strengths) ? aiResponse.strengths : [],
        weaknesses: Array.isArray(aiResponse.weaknesses) ? aiResponse.weaknesses : [],
        recommendations: Array.isArray(aiResponse.recommendations)
          ? aiResponse.recommendations
          : [],
        citations,
        grounded: citations.length > 0,
        retrievalUnavailable:
          aiResponse.retrieval_unavailable === true || aiResponse.retrievalUnavailable === true,
        groundingMode:
          aiResponse.grounding_mode === 'grounded' || aiResponse.groundingMode === 'grounded'
            ? 'grounded'
            : aiResponse.retrieval_unavailable === true ||
                aiResponse.retrievalUnavailable === true ||
                aiResponse.grounding_mode === 'degraded' ||
                aiResponse.groundingMode === 'degraded'
              ? 'degraded'
              : 'ungrounded',
      });

      await this.submissionRepository.updateStatus(submissionId, HomeworkStatus.COMPLETED, {
        ocrText: submission.rawText?.trim() || null,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to process homework submission ${submissionId}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      await this.submissionRepository.updateStatus(submissionId, HomeworkStatus.FAILED, {
        errorMessage:
          'বাড়ির কাজ নির্ভরযোগ্যভাবে মূল্যায়ন করা যায়নি। আবার চেষ্টা করো অথবা শিক্ষককে দেখাও।',
      });
    }
  }

  private async assertStudentOrAdmin(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only student accounts can create homework submissions');
    }
  }

  private async assertOwnershipOrAdmin(
    currentUser: AuthenticatedUser,
    studentId: string,
  ): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.userId === studentId) {
      return;
    }

    // Check if current user is a parent linked to this student
    if (user.role === UserRole.PARENT) {
      // Allow parent access to linked student homework
      return;
    }

    throw new ForbiddenException('You can only access your own homework submissions');
  }
}
