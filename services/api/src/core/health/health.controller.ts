import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness check for container orchestration' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check verifying MongoDB and Redis connectivity' })
  @ApiResponse({ status: 200, description: 'Service and dependencies are ready' })
  getReadiness() {
    return this.healthService.getReadiness();
  }
}
