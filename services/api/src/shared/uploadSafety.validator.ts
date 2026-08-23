import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { objectStorageService, StorageCategory } from './objectStorage.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Limit

export interface SafeUploadedFile {
  originalName: string;
  generatedFileName: string;
  mimeType: string;
  sizeBytes: number;
  fileKey: string;
  signedUrl: string;
}

export class StudentUploadSafetyValidator {
  /**
   * 1. Path Traversal & Filename Sanitization
   * Prevents ../../ malicious path traversal attacks by extracting base filename and generating a cryptographically secure UUID.
   */
  public sanitizeAndGenerateFilename(originalFilename: string): { safeName: string; extension: string } {
    const basename = path.basename(originalFilename);
    const ext = path.extname(basename).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`INVALID_FILE_EXTENSION: Extension '${ext}' is not permitted.`);
    }

    const randomUuid = crypto.randomUUID();
    const safeName = `${randomUuid}${ext}`;

    return { safeName, extension: ext };
  }

  /**
   * 2. Strict MIME Type, File Size, Magic Bytes Validation
   */
  public validateFileBuffer(buffer: Buffer, mimeType: string) {
    // File Size Guard (5 MB max)
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`FILE_TOO_LARGE: File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds 5 MB limit.`);
    }

    // MIME Type Guard
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new Error(`UNSUPPORTED_MIME_TYPE: MIME type '${mimeType}' is not permitted.`);
    }

    // Magic Bytes Verification (PNG, JPEG, PDF)
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    if (!isPng && !isJpeg && !isPdf) {
      throw new Error('CORRUPTED_OR_MALICIOUS_FILE: File magic byte header does not match expected image/pdf signature.');
    }
  }

  /**
   * 3. Process Safe Upload directly to Cloud Object Storage (Outside API container filesystem)
   */
  public async processSafeUpload(
    originalName: string,
    mimeType: string,
    buffer: Buffer,
    category: StorageCategory = 'homework_images'
  ): Promise<SafeUploadedFile> {
    // Step 1: Validate file buffer & magic bytes
    this.validateFileBuffer(buffer, mimeType);

    // Step 2: Sanitize & generate UUID filename
    const { safeName } = this.sanitizeAndGenerateFilename(originalName);

    // Step 3: Stream directly to S3/GCS Object Storage
    const uploadRef = await objectStorageService.uploadFile({
      filename: safeName,
      category,
      mimeType,
      buffer,
    });

    // Step 4: Generate signed expiring access URL
    const signedUrl = objectStorageService.generateSignedUrl(uploadRef.fileKey, 3600);

    return {
      originalName: path.basename(originalName),
      generatedFileName: safeName,
      mimeType,
      sizeBytes: buffer.length,
      fileKey: uploadRef.fileKey,
      signedUrl,
    };
  }
}

export const studentUploadSafetyValidator = new StudentUploadSafetyValidator();
