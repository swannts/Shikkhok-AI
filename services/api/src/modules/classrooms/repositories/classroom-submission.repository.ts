import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ClassroomSubmission,
  ClassroomSubmissionDocument,
} from '../schemas/classroom-submission.schema';
import { SubmissionStatus } from '../enums/submission-status.enum';

@Injectable()
export class ClassroomSubmissionRepository {
  constructor(
    @InjectModel(ClassroomSubmission.name)
    private readonly submissionModel: Model<ClassroomSubmissionDocument>,
  ) {}

  async submitAssignment(data: {
    assignmentId: string;
    classroomId: string;
    studentId: string;
    content: string;
    attachmentUrls: string[];
    isLate: boolean;
  }): Promise<ClassroomSubmissionDocument | null> {
    const assignmentObjectId = new Types.ObjectId(data.assignmentId);
    const classroomObjectId = new Types.ObjectId(data.classroomId);
    const studentObjectId = new Types.ObjectId(data.studentId);
    const status = data.isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED;

    return this.submissionModel
      .findOneAndUpdate(
        { assignmentId: assignmentObjectId, studentId: studentObjectId },
        {
          $set: {
            content: data.content,
            attachmentUrls: data.attachmentUrls,
            submittedAt: new Date(),
            status,
          },
          $setOnInsert: {
            assignmentId: assignmentObjectId,
            classroomId: classroomObjectId,
            studentId: studentObjectId,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findById(id: string): Promise<ClassroomSubmissionDocument | null> {
    return this.submissionModel.findById(id).exec();
  }

  async findByAssignmentAndStudent(
    assignmentId: string,
    studentId: string,
  ): Promise<ClassroomSubmissionDocument | null> {
    return this.submissionModel
      .findOne({
        assignmentId: new Types.ObjectId(assignmentId),
        studentId: new Types.ObjectId(studentId),
      })
      .exec();
  }

  async findByAssignmentId(assignmentId: string): Promise<ClassroomSubmissionDocument[]> {
    return this.submissionModel
      .find({ assignmentId: new Types.ObjectId(assignmentId) })
      .sort({ submittedAt: 1 })
      .exec();
  }

  async gradeSubmission(
    submissionId: string,
    score: number,
    teacherFeedback?: string,
  ): Promise<ClassroomSubmissionDocument | null> {
    return this.submissionModel
      .findByIdAndUpdate(
        submissionId,
        {
          $set: {
            score,
            teacherFeedback,
            status: SubmissionStatus.GRADED,
            gradedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();
  }
}
