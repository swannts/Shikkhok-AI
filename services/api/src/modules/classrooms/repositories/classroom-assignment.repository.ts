import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ClassroomAssignment,
  ClassroomAssignmentDocument,
} from '../schemas/classroom-assignment.schema';

@Injectable()
export class ClassroomAssignmentRepository {
  constructor(
    @InjectModel(ClassroomAssignment.name)
    private readonly assignmentModel: Model<ClassroomAssignmentDocument>,
  ) {}

  async createAssignment(data: Partial<ClassroomAssignment>): Promise<ClassroomAssignmentDocument> {
    const assignment = new this.assignmentModel(data);
    return assignment.save();
  }

  async findById(id: string): Promise<ClassroomAssignmentDocument | null> {
    return this.assignmentModel.findById(id).exec();
  }

  async findByClassroomId(classroomId: string): Promise<ClassroomAssignmentDocument[]> {
    return this.assignmentModel
      .find({
        classroomId: new Types.ObjectId(classroomId),
        isPublished: true,
      })
      .sort({ dueDate: 1 })
      .exec();
  }
}
