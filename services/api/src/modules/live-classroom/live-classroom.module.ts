import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LiveClassroomGateway } from './live-classroom.gateway';
import { LiveClassroomService } from './live-classroom.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [LiveClassroomGateway, LiveClassroomService],
  exports: [LiveClassroomService],
})
export class LiveClassroomModule {}
