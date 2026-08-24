import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { TextbookRepository } from './repositories/textbook.repository';
import { TextbookManifestRepository } from './repositories/textbook-manifest.repository';
import { ListTextbooksQueryDto } from './dto/list-textbooks-query.dto';
import { ManifestBundleQueryDto } from './dto/manifest-bundle-query.dto';
import { ManifestStatus } from './enums/manifest-status.enum';

@Injectable()
export class TextbooksService {
  constructor(
    private readonly textbookRepository: TextbookRepository,
    private readonly manifestRepository: TextbookManifestRepository,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
  ) {}

  async listTextbooks(
    currentUser: AuthenticatedUser,
    query: ListTextbooksQueryDto,
  ): Promise<Record<string, any>[]> {
    const classLevel = query.classLevel ?? (await this.resolveClassLevel(currentUser.userId));
    const medium = query.medium ?? (await this.resolveMedium(currentUser.userId));
    const curriculumYear =
      query.curriculumYear ?? (await this.resolveCurriculumYear(currentUser.userId));

    const textbooks = await this.textbookRepository.findPublished({
      classLevel,
      medium,
      curriculumYear,
      subjectId: query.subjectId,
    });

    return textbooks.map((tb) => tb.toJSON());
  }

  async getTextbook(
    currentUser: AuthenticatedUser,
    textbookId: string,
  ): Promise<Record<string, any>> {
    const textbook = await this.textbookRepository.findById(textbookId);
    if (!textbook || !textbook.isPublished) {
      throw new NotFoundException('Textbook not found');
    }
    return textbook.toJSON();
  }

  async getTextbookManifest(
    currentUser: AuthenticatedUser,
    textbookId: string,
  ): Promise<Record<string, any>> {
    const textbook = await this.textbookRepository.findById(textbookId);
    if (!textbook || !textbook.isPublished) {
      throw new NotFoundException('Textbook not found');
    }

    let manifest = await this.manifestRepository.findLatestByTextbookId(textbookId);
    if (!manifest) {
      // Generate default manifest
      manifest = await this.manifestRepository.createManifest({
        textbookId: textbook._id,
        version: '1.0.0',
        packageUrl:
          textbook.pdfUrl || `https://cdn.shikkhok.ai/packages/textbooks/${textbook._id}.zip`,
        downloadSizeBytes: textbook.fileSizeBytes || 15728640,
        checksumSha256:
          textbook.checksumSha256 ||
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        chapters: [],
        status: ManifestStatus.READY,
        releasedAt: new Date(),
      });
    }

    return {
      manifest: manifest.toJSON(),
      textbook: textbook.toJSON(),
    };
  }

  async getManifestBundle(
    currentUser: AuthenticatedUser,
    query: ManifestBundleQueryDto,
  ): Promise<Record<string, any>> {
    const classLevel = query.classLevel ?? (await this.resolveClassLevel(currentUser.userId));
    const medium = query.medium ?? (await this.resolveMedium(currentUser.userId));
    const curriculumYear =
      query.curriculumYear ?? (await this.resolveCurriculumYear(currentUser.userId));

    const textbooks = await this.textbookRepository.findPublished({
      classLevel,
      medium,
      curriculumYear,
    });

    const textbookIds = textbooks.map((tb) => tb._id);
    const manifests = await this.manifestRepository.findLatestByTextbookIds(textbookIds);

    const manifestMap = new Map<string, any>();
    for (const m of manifests) {
      manifestMap.set(m.textbookId.toString(), m.toJSON());
    }

    let totalSizeBytes = 0;
    const items = textbooks.map((tb) => {
      const tbId = tb._id.toString();
      const manifest = manifestMap.get(tbId) ?? {
        version: '1.0.0',
        packageUrl: tb.pdfUrl || `https://cdn.shikkhok.ai/packages/textbooks/${tbId}.zip`,
        downloadSizeBytes: tb.fileSizeBytes || 15728640,
        checksumSha256:
          tb.checksumSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };
      totalSizeBytes += manifest.downloadSizeBytes;
      return {
        textbook: tb.toJSON(),
        manifest,
      };
    });

    return {
      bundle: {
        classLevel,
        medium,
        curriculumYear,
        totalItems: items.length,
        totalSizeBytes,
        generatedAt: new Date().toISOString(),
      },
      items,
    };
  }

  private async resolveClassLevel(userId: string): Promise<number> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.classLevel ?? 8;
    } catch {
      return 8;
    }
  }

  private async resolveMedium(userId: string): Promise<string> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.medium ?? 'bangla';
    } catch {
      return 'bangla';
    }
  }

  private async resolveCurriculumYear(userId: string): Promise<number> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.curriculumYear ?? 2026;
    } catch {
      return 2026;
    }
  }
}
