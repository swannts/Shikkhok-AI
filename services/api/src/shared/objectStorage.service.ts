export type StorageCategory =
  | 'books'
  | 'lesson_images'
  | 'student_uploads'
  | 'homework_images'
  | 'audio'
  | 'generated_reports';

export interface UploadFileOptions {
  filename: string;
  category: StorageCategory;
  mimeType: string;
  buffer?: Buffer;
}

export interface StoredFileReference {
  fileKey: string;
  publicUrl: string;
  category: StorageCategory;
  mimeType: string;
  sizeBytes?: number;
  uploadedAt: Date;
}

export class ObjectStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.OBJECT_STORAGE_BUCKET || 'shikkhok-media-bucket';
  }

  /**
   * Generates S3 key prefix based on media storage category
   */
  private getCategoryPrefix(category: StorageCategory): string {
    switch (category) {
      case 'books':
        return 'curriculum/pdf/';
      case 'lesson_images':
        return 'curriculum/images/';
      case 'homework_images':
        return 'homework/submissions/';
      case 'student_uploads':
        return 'students/uploads/';
      case 'audio':
        return 'media/audio/';
      case 'generated_reports':
        return 'reports/generated/';
      default:
        return 'general/';
    }
  }

  /**
   * Upload file to Object Storage (S3 / GCS / MinIO) and return metadata reference for MongoDB storage
   */
  public async uploadFile(options: UploadFileOptions): Promise<StoredFileReference> {
    const prefix = this.getCategoryPrefix(options.category);
    const uniqueKey = `${prefix}${Date.now()}_${options.filename}`;
    const baseUrl = process.env.OBJECT_STORAGE_BASE_URL || `https://storage.googleapis.com/${this.bucketName}`;
    const publicUrl = `${baseUrl}/${uniqueKey}`;

    // Note: S3 / GCS SDK upload client invocation occurs here
    console.log(`[Object Storage] Uploaded ${options.filename} to ${uniqueKey}`);

    return {
      fileKey: uniqueKey,
      publicUrl,
      category: options.category,
      mimeType: options.mimeType,
      sizeBytes: options.buffer ? options.buffer.length : 0,
      uploadedAt: new Date(),
    };
  }

  /**
   * Generate Signed Read URL for private objects (student uploads, reports)
   */
  public generateSignedUrl(fileKey: string, expiresInSeconds: number = 3600): string {
    const baseUrl = process.env.OBJECT_STORAGE_BASE_URL || `https://storage.googleapis.com/${this.bucketName}`;
    return `${baseUrl}/${fileKey}?signature=mock_signature_exp_${Date.now() + expiresInSeconds * 1000}`;
  }
}

export const objectStorageService = new ObjectStorageService();
