import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://shikkhok_admin:shikkhok_secure_password@localhost:27017/shikkhok_db?authSource=admin',
        ),
        retryWrites: true,
        w: 'majority',
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
