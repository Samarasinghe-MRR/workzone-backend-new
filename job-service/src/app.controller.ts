import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  @ApiOperation({ summary: "Service health status" })
  getHealth() {
    return {
      status: "ok",
      service: "job-service",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }
}
