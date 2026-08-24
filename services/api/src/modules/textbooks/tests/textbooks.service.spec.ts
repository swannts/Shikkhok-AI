import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TextbooksService } from '../textbooks.service';
import { TextbookRepository } from '../repositories/textbook.repository';
import { TextbookManifestRepository } from '../repositories/textbook-manifest.repository';
import { UsersService } from '../../users/users.service';
import { StudentsService } from '../../students/students.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { ManifestStatus } from '../enums/manifest-status.enum';

describe('TextbooksService', () => {
  let service: TextbooksService;
  let textbookRepository: jest.Mocked<TextbookRepository>;
  let manifestRepository: jest.Mocked<TextbookManifestRepository>;
  let studentsService: jest.Mocked<StudentsService>;

  const studentUser = { userId: new Types.ObjectId().toString(), role: UserRole.STUDENT };

  const mockTextbook = {
    _id: new Types.ObjectId(),
    title: 'Class 8 Mathematics',
    titleBn: 'অষ্টম শ্রেণি গণিত',
    classLevel: 8,
    medium: 'bangla',
    curriculumYear: 2026,
    isPublished: true,
    fileSizeBytes: 20480000,
    checksumSha256: 'a1b2c3d4e5',
    pdfUrl: 'https://cdn.shikkhok.ai/books/math8.pdf',
    toJSON: jest.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextbooksService,
        {
          provide: TextbookRepository,
          useValue: {
            createTextbook: jest.fn(),
            findById: jest.fn(),
            findPublished: jest.fn(),
          },
        },
        {
          provide: TextbookManifestRepository,
          useValue: {
            createManifest: jest.fn(),
            findLatestByTextbookId: jest.fn(),
            findLatestByTextbookIds: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: StudentsService,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TextbooksService);
    textbookRepository = module.get(TextbookRepository);
    manifestRepository = module.get(TextbookManifestRepository);
    studentsService = module.get(StudentsService);
  });

  it('should list published textbooks matching student curriculum profile', async () => {
    studentsService.getProfileByUserId.mockResolvedValue({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    } as any);
    textbookRepository.findPublished.mockResolvedValue([mockTextbook as any]);

    const result = await service.listTextbooks(studentUser, {});
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Class 8 Mathematics');
    expect(textbookRepository.findPublished).toHaveBeenCalledWith({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
      subjectId: undefined,
    });
  });

  it('should get textbook by ID and throw NotFoundException if missing', async () => {
    textbookRepository.findById.mockResolvedValue(null);
    await expect(service.getTextbook(studentUser, 'nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should get or dynamically generate offline textbook manifest with checksums', async () => {
    textbookRepository.findById.mockResolvedValue(mockTextbook as any);
    manifestRepository.findLatestByTextbookId.mockResolvedValue(null);
    manifestRepository.createManifest.mockResolvedValue({
      _id: new Types.ObjectId(),
      textbookId: mockTextbook._id,
      version: '1.0.0',
      status: ManifestStatus.READY,
      downloadSizeBytes: 20480000,
      checksumSha256: 'a1b2c3d4e5',
      toJSON: jest.fn().mockReturnValue({ version: '1.0.0', checksumSha256: 'a1b2c3d4e5' }),
    } as any);

    const result = await service.getTextbookManifest(studentUser, mockTextbook._id.toString());
    expect(result.manifest).toBeDefined();
    expect(result.manifest.version).toBe('1.0.0');
    expect(manifestRepository.createManifest).toHaveBeenCalled();
  });

  it('should generate 1-click batch download manifest bundle for grade offline sync', async () => {
    studentsService.getProfileByUserId.mockResolvedValue({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    } as any);
    textbookRepository.findPublished.mockResolvedValue([mockTextbook as any]);
    manifestRepository.findLatestByTextbookIds.mockResolvedValue([
      {
        textbookId: mockTextbook._id,
        version: '1.0.0',
        packageUrl: 'https://cdn.shikkhok.ai/packages/math8.zip',
        downloadSizeBytes: 20480000,
        checksumSha256: 'a1b2c3d4e5',
        toJSON: jest.fn().mockReturnValue({
          version: '1.0.0',
          downloadSizeBytes: 20480000,
          checksumSha256: 'a1b2c3d4e5',
        }),
      } as any,
    ]);

    const bundle = await service.getManifestBundle(studentUser, {});
    expect(bundle.bundle.totalItems).toBe(1);
    expect(bundle.bundle.totalSizeBytes).toBe(20480000);
    expect(bundle.items).toHaveLength(1);
  });
});
