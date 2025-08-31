import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "API Gateway health check" })
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Get("version")
  @ApiOperation({ summary: "Get API Gateway version" })
  getVersion() {
    return this.appService.getVersion();
  }
}
