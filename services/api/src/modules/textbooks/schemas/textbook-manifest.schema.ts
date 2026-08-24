import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Textbook } from './textbook.schema';
import { ManifestStatus } from '../enums/manifest-status.enum';

export type TextbookManifestDocument = HydratedDocument<TextbookManifest>;

export interface ManifestChapterSummary {
  chapterId: string;
  title: string;
  lessonCount: number;
  resourceUrls: string[];
}

@Schema({
  collection: 'textbook_manifests',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.textbookId = ret.textbookId?.toString?.() ?? ret.textbookId;
      delete ret.__v;
      return ret;
    },
  },
})
export class TextbookManifest {
  @Prop({ type: Types.ObjectId, ref: Textbook.name, required: true, index: true })
  textbookId: Types.ObjectId;

  @Prop({ required: true, trim: true, default: '1.0.0' })
  version: string;

  @Prop({ required: true, trim: true })
  packageUrl: string;

  @Prop({ type: Number, required: true, min: 0 })
  downloadSizeBytes: number;

  @Prop({ required: true, trim: true })
  checksumSha256: string;

  @Prop({
    type: [{ chapterId: String, title: String, lessonCount: Number, resourceUrls: [String] }],
    default: [],
  })
  chapters: ManifestChapterSummary[];

  @Prop({
    required: true,
    enum: Object.values(ManifestStatus),
    default: ManifestStatus.READY,
    index: true,
  })
  status: ManifestStatus;

  @Prop({ type: Date, default: () => new Date() })
  releasedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TextbookManifestSchema = SchemaFactory.createForClass(TextbookManifest);
TextbookManifestSchema.index({ textbookId: 1, version: 1 }, { unique: true });
TextbookManifestSchema.index({ status: 1, releasedAt: -1 });
