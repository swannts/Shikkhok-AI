import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClassroomMember, ClassroomMemberDocument } from '../schemas/classroom-member.schema';
import { ClassroomRole } from '../enums/classroom-role.enum';

@Injectable()
export class ClassroomMemberRepository {
  constructor(
    @InjectModel(ClassroomMember.name)
    private readonly memberModel: Model<ClassroomMemberDocument>,
  ) {}

  async addMember(
    classroomId: string,
    studentId: string,
    role: ClassroomRole = ClassroomRole.STUDENT,
  ): Promise<ClassroomMemberDocument | null> {
    const classroomObjectId = new Types.ObjectId(classroomId);
    const studentObjectId = new Types.ObjectId(studentId);

    return this.memberModel
      .findOneAndUpdate(
        { classroomId: classroomObjectId, studentId: studentObjectId },
        {
          $setOnInsert: {
            classroomId: classroomObjectId,
            studentId: studentObjectId,
            role,
            joinedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async isMember(classroomId: string, studentId: string): Promise<boolean> {
    const count = await this.memberModel.countDocuments({
      classroomId: new Types.ObjectId(classroomId),
      studentId: new Types.ObjectId(studentId),
    });
    return count > 0;
  }

  async countMembers(classroomId: string): Promise<number> {
    return this.memberModel.countDocuments({
      classroomId: new Types.ObjectId(classroomId),
    });
  }

  async findByStudentId(studentId: string): Promise<ClassroomMemberDocument[]> {
    return this.memberModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ joinedAt: -1 })
      .exec();
  }

  async findByClassroomId(classroomId: string): Promise<ClassroomMemberDocument[]> {
    return this.memberModel
      .find({ classroomId: new Types.ObjectId(classroomId) })
      .sort({ joinedAt: 1 })
      .exec();
  }
}
