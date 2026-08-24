import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Classroom, ClassroomDocument } from '../schemas/classroom.schema';

@Injectable()
export class ClassroomRepository {
  constructor(
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
  ) {}

  async createClassroom(data: Partial<Classroom>): Promise<ClassroomDocument> {
    const classroom = new this.classroomModel(data);
    return classroom.save();
  }

  async findById(id: string): Promise<ClassroomDocument | null> {
    return this.classroomModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<ClassroomDocument | null> {
    return this.classroomModel.findOne({ code: code.toUpperCase().trim() }).exec();
  }

  async findByTeacherId(teacherId: string): Promise<ClassroomDocument[]> {
    return this.classroomModel
      .find({ teacherId: new Types.ObjectId(teacherId), isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByIds(classroomIds: (string | Types.ObjectId)[]): Promise<ClassroomDocument[]> {
    const objectIds = classroomIds.map((id) =>
      typeof id === 'string' ? new Types.ObjectId(id) : id,
    );
    return this.classroomModel
      .find({ _id: { $in: objectIds }, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }
}
