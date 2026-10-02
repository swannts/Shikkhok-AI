import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
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
  async getReadiness(@Res({ passthrough: true }) response: Response) {
    const readiness = await this.healthService.getReadiness();
    if (readiness.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return readiness;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus / OpenMetrics telemetry scraping endpoint' })
  @ApiResponse({ status: 200, description: 'OpenMetrics Prometheus telemetry data' })
  getMetrics() {
    return this.healthService.getMetrics();
  }
}
