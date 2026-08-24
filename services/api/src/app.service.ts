import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'shikkhok-ai-nestjs-backend',
      database: 'MongoDB NoSQL',
      timestamp: new Date().toISOString(),
    };
  }
}
