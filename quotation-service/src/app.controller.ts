import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Get service info" })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  @ApiOperation({ summary: "Health check endpoint" })
  getHealth() {
    return {
      service: "quotation-service",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }
}
