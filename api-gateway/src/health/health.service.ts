import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  getGatewayHealth() {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0",
    };
  }
}
