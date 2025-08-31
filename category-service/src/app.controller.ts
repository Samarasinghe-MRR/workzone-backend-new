import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("Health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  @ApiResponse({ status: 200, description: "Service health check" })
  getHealth() {
    return this.appService.getHealth();
  }
}
