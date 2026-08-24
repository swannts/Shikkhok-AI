import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TextbookManifest, TextbookManifestDocument } from '../schemas/textbook-manifest.schema';
import { ManifestStatus } from '../enums/manifest-status.enum';

@Injectable()
export class TextbookManifestRepository {
  constructor(
    @InjectModel(TextbookManifest.name)
    private readonly manifestModel: Model<TextbookManifestDocument>,
  ) {}

  async createManifest(data: Partial<TextbookManifest>): Promise<TextbookManifestDocument> {
    const manifest = new this.manifestModel(data);
    return manifest.save();
  }

  async findLatestByTextbookId(textbookId: string): Promise<TextbookManifestDocument | null> {
    return this.manifestModel
      .findOne({
        textbookId: new Types.ObjectId(textbookId),
        status: ManifestStatus.READY,
      })
      .sort({ releasedAt: -1 })
      .exec();
  }

  async findLatestByTextbookIds(
    textbookIds: (string | Types.ObjectId)[],
  ): Promise<TextbookManifestDocument[]> {
    const objectIds = textbookIds.map((id) =>
      typeof id === 'string' ? new Types.ObjectId(id) : id,
    );
    return this.manifestModel
      .find({
        textbookId: { $in: objectIds },
        status: ManifestStatus.READY,
      })
      .sort({ releasedAt: -1 })
      .exec();
  }
}
