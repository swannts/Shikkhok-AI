import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { Textbook, TextbookSchema } from './schemas/textbook.schema';
import { TextbookManifest, TextbookManifestSchema } from './schemas/textbook-manifest.schema';
import { TextbookRepository } from './repositories/textbook.repository';
import { TextbookManifestRepository } from './repositories/textbook-manifest.repository';
import { TextbooksService } from './textbooks.service';
import { TextbooksController } from './textbooks.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    MongooseModule.forFeature([
      { name: Textbook.name, schema: TextbookSchema },
      { name: TextbookManifest.name, schema: TextbookManifestSchema },
    ]),
  ],
  controllers: [TextbooksController],
  providers: [TextbookRepository, TextbookManifestRepository, TextbooksService],
  exports: [TextbooksService, TextbookRepository, TextbookManifestRepository],
})
export class TextbooksModule {}
