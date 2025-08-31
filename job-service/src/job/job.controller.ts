import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JobService } from "./job.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("jobs")
@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new job posting" })
  @ApiResponse({ status: 201, description: "Job created successfully" })
  create(@Body() createJobDto: CreateJobDto, @Request() req: any) {
    // Debug log to see what's in the user object
    console.log("User object from JWT:", req.user);

    const userId = req.user.id || req.user.userId || req.user.sub;
    const userEmail = req.user.email || "default@example.com"; // Fallback email

    if (!userId) {
      throw new Error("User ID not found in JWT token");
    }

    return this.jobService.create(createJobDto, userId, userEmail);
  }

  @Get()
  @ApiOperation({ summary: "Get all jobs with filtering" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "location", required: false })
  @ApiQuery({ name: "minBudget", required: false, type: Number })
  @ApiQuery({ name: "maxBudget", required: false, type: Number })
  @ApiQuery({ name: "priority", required: false })
  @ApiQuery({ name: "lat", required: false, type: Number })
  @ApiQuery({ name: "lng", required: false, type: Number })
  @ApiQuery({ name: "radius", required: false, type: Number })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  findAll(@Query() query: any) {
    return this.jobService.findAll({
      status: query.status,
      category: query.category,
      location: query.location,
      minBudget: query.minBudget ? parseFloat(query.minBudget) : undefined,
      maxBudget: query.maxBudget ? parseFloat(query.maxBudget) : undefined,
      priority: query.priority,
      lat: query.lat ? parseFloat(query.lat) : undefined,
      lng: query.lng ? parseFloat(query.lng) : undefined,
      radius: query.radius ? parseFloat(query.radius) : undefined,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
  }

  @Get("my-jobs")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get jobs posted by the current user" })
  getMyJobs(@Request() req: any, @Query("status") status?: string) {
    return this.jobService.getJobsByCustomer(req.user.id, status as any);
  }

  @Get("assigned-jobs")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get jobs assigned to the current service provider",
  })
  getAssignedJobs(@Request() req: any, @Query("status") status?: string) {
    return this.jobService.getJobsByProvider(req.user.id, status as any);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific job by ID" })
  findOne(@Param("id") id: string) {
    return this.jobService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a job posting" })
  update(
    @Param("id") id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Request() req: any
  ) {
    return this.jobService.update(id, updateJobDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a job posting" })
  remove(@Param("id") id: string, @Request() req: any) {
    return this.jobService.remove(id, req.user.id);
  }

  @Post(":id/assign")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign a job to a service provider" })
  assignJob(
    @Param("id") jobId: string,
    @Request() req: any,
    @Body("serviceProviderId") serviceProviderId: string,
    @Body("quoteAmount") quoteAmount?: number,
    @Body("estimatedDuration") estimatedDuration?: string
  ) {
    return this.jobService.assignProvider(
      jobId,
      serviceProviderId,
      req.user.id,
      quoteAmount,
      estimatedDuration
    );
  }

  @Post(":id/complete")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark a job as completed" })
  completeJob(@Param("id") jobId: string, @Request() req: any) {
    return this.jobService.completeJob(jobId, req.user.id);
  }

  // Public endpoints for microservice communication
  @Get("customer/:customerId")
  @ApiOperation({
    summary: "Get jobs by customer ID (for microservice communication)",
  })
  getJobsByCustomerId(
    @Param("customerId") customerId: string,
    @Query("status") status?: string
  ) {
    return this.jobService.getJobsByCustomer(customerId, status as any);
  }

  @Get("provider/:providerId")
  @ApiOperation({
    summary: "Get jobs by provider ID (for microservice communication)",
  })
  getJobsByProviderId(
    @Param("providerId") providerId: string,
    @Query("status") status?: string
  ) {
    return this.jobService.getJobsByProvider(providerId, status as any);
  }
}
