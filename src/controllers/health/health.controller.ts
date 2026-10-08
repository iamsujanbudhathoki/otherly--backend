import { Controller, Get, Route, Tags } from 'tsoa';
import { AppDataSource } from '../../config/database.config';
import { ApiResponse } from '../../interfaces/apiResponse.interface';

export interface HealthCheckData {
  status: string;
  database: string;
  uptimeSeconds: number;
  timestamp: string;
}

@Route('health')
@Tags('Health & Status')
export class HealthController extends Controller {
  @Get('/')
  async checkHealth(): Promise<ApiResponse<HealthCheckData>> {
    const isDbConnected = AppDataSource.isInitialized;
    if (!isDbConnected) {
      this.setStatus(503);
    }

    return {
      data: {
        status: isDbConnected ? 'ok' : 'degraded',
        database: isDbConnected ? 'connected' : 'disconnected',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      message: isDbConnected
        ? 'Service is healthy'
        : 'Database connection unavailable',
      success: isDbConnected,
    };
  }
}
