import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { HealthService } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("gateway")
  @ApiOperation({ summary: "Check API Gateway health" })
  getGatewayHealth() {
    return this.healthService.getGatewayHealth();
  }
}
