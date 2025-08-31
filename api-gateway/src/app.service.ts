import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth(): string {
    return "API Gateway is running! 🚀";
  }

  getVersion() {
    return {
      name: "WorkZone API Gateway",
      version: "1.0.0",
      description: "Central entry point for WorkZone microservices",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        auth: process.env.AUTH_SERVICE_URL || "http://localhost:3000",
        user: process.env.USER_SERVICE_URL || "http://localhost:3001",
        job: process.env.JOB_SERVICE_URL || "http://localhost:3002",
        quotation: process.env.QUOTATION_SERVICE_URL || "http://localhost:3004",
      },
    };
  }
}
