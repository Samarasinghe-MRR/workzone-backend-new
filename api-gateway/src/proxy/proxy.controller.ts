import {
  Controller,
  All,
  Req,
  Res,
  Headers,
  Query,
  Body,
  Param,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

import { ProxyService } from "./proxy.service";

@ApiTags("proxy")
@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  // ==================== AUTH SERVICE ROUTES ====================

  @All("auth/*")
  @ApiOperation({ summary: "Forward requests to Auth Service" })
  async forwardToAuthService(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any,
    @Query() query: any,
    @Body() body: any
  ) {
    const path = req.path.replace("/api", "");

    this.proxyService
      .forwardRequest("auth", path, req.method, headers, body, query)
      .subscribe({
        next: (data) => res.json(data),
        error: (error) => {
          res
            .status(error.status || 500)
            .json(error.response || { message: error.message });
        },
      });
  }

  // ==================== USER SERVICE ROUTES ====================

  @All("users/*")
  @ApiOperation({ summary: "Forward requests to User Service" })
  @ApiBearerAuth("JWT-auth")
  async forwardToUserService(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any,
    @Query() query: any,
    @Body() body: any
  ) {
    const path = req.path.replace("/api", "");

    // Simply pass through the request - let user-service handle authentication
    // This maintains microservice principle where each service manages its own concerns
    this.proxyService
      .forwardRequest("users", path, req.method, headers, body, query)
      .subscribe({
        next: (data) => res.json(data),
        error: (error) => {
          res
            .status(error.status || 500)
            .json(error.response || { message: error.message });
        },
      });
  }

  // ==================== JOB SERVICE ROUTES ====================

  @All("jobs/*")
  @ApiOperation({ summary: "Forward requests to Job Service" })
  @ApiBearerAuth("JWT-auth")
  async forwardToJobService(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any,
    @Query() query: any,
    @Body() body: any
  ) {
    const path = req.path.replace("/api", "");

    // Simply pass through the request - let job-service handle authentication
    this.proxyService
      .forwardRequest("jobs", path, req.method, headers, body, query)
      .subscribe({
        next: (data) => res.json(data),
        error: (error) => {
          res
            .status(error.status || 500)
            .json(error.response || { message: error.message });
        },
      });
  }

  // ==================== QUOTATION SERVICE ROUTES ====================

  @All("quotations/*")
  @ApiOperation({ summary: "Forward requests to Quotation Service" })
  @ApiBearerAuth("JWT-auth")
  async forwardToQuotationService(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any,
    @Query() query: any,
    @Body() body: any
  ) {
    const path = req.path.replace("/api", "");

    // Simply pass through the request - let quotation-service handle authentication
    this.proxyService
      .forwardRequest("quotations", path, req.method, headers, body, query)
      .subscribe({
        next: (data) => res.json(data),
        error: (error) => {
          res
            .status(error.status || 500)
            .json(error.response || { message: error.message });
        },
      });
  }

  // ==================== HEALTH CHECK ROUTES ====================

  @All("health")
  @ApiOperation({ summary: "Check all services health" })
  async getHealthCheck(@Res() res: Response) {
    try {
      const health = await this.proxyService.getAllServicesHealth();
      const statusCode = health.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ==================== CATEGORY SERVICE ROUTES ====================

  @All("categories/*")
  @ApiOperation({ summary: "Forward requests to Category Service" })
  async forwardToCategoryService(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any,
    @Query() query: any,
    @Body() body: any
  ) {
    const path = req.path.replace("/api", "");

    // Category Service handles its own JWT validation for admin endpoints
    this.proxyService
      .forwardRequest("categories", path, req.method, headers, body, query)
      .subscribe({
        next: (data) => res.json(data),
        error: (error) => {
          res
            .status(error.status || 500)
            .json(error.response || { message: error.message });
        },
      });
  }

  // ==================== HEALTH CHECKS ====================
  @ApiOperation({ summary: "Check specific service health" })
  async getServiceHealth(
    @Param("service") service: string,
    @Res() res: Response
  ) {
    try {
      const health = await this.proxyService.getServiceHealth(service);
      const statusCode = health.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
