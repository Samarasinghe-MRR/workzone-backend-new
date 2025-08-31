import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EventPublisherService } from "../events/event-publisher.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import {
  JobStatus,
  JobPriority,
  AssignmentStatus,
} from "../../generated/prisma";

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService
  ) {}

  async create(createJobDto: CreateJobDto, userId: string, userEmail: string) {
    const jobData = {
      ...createJobDto,
      customer_id: userId,
      customer_email: userEmail,
      scheduled_at: createJobDto.scheduled_at
        ? new Date(createJobDto.scheduled_at)
        : null,
      deadline: createJobDto.deadline ? new Date(createJobDto.deadline) : null,
    };

    const job = await this.prisma.job.create({
      data: jobData,
      include: {
        assignments: true,
      },
    });

    // Publish job.created event for Quote Service
    this.eventPublisher.publishJobCreated({
      jobId: job.id,
      customerId: job.customer_id,
      title: job.title,
      category: job.category,
      budget_min: job.budget_min,
      budget_max: job.budget_max,
      location: job.location,
      createdAt: job.created_at,
    });

    return job;
  }

  async findAll(filters?: {
    status?: JobStatus;
    category?: string;
    location?: string;
    minBudget?: number;
    maxBudget?: number;
    priority?: JobPriority;
    customerId?: string;
    lat?: number;
    lng?: number;
    radius?: number; // km
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.category)
      where.category = { contains: filters.category, mode: "insensitive" };
    if (filters?.location)
      where.location = { contains: filters.location, mode: "insensitive" };
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.customerId) where.customer_id = filters.customerId;

    if (filters?.minBudget || filters?.maxBudget) {
      where.OR = [];
      if (filters.minBudget) {
        where.OR.push({ budget_min: { gte: filters.minBudget } });
        where.OR.push({ budget_max: { gte: filters.minBudget } });
      }
      if (filters.maxBudget) {
        where.OR.push({ budget_min: { lte: filters.maxBudget } });
        where.OR.push({ budget_max: { lte: filters.maxBudget } });
      }
    }

    // Geospatial filter (basic implementation)
    if (filters?.lat && filters?.lng && filters?.radius) {
      // Simple bounding box - for production, use PostGIS
      const latRange = filters.radius / 111; // Rough conversion
      const lngRange =
        filters.radius / (111 * Math.cos((filters.lat * Math.PI) / 180));

      where.location_lat = {
        gte: filters.lat - latRange,
        lte: filters.lat + latRange,
      };
      where.location_lng = {
        gte: filters.lng - lngRange,
        lte: filters.lng + lngRange,
      };
    }

    const [jobs, totalCount] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          assignments: {
            include: {
              // We'll fetch provider details from User Service via gRPC
            },
          },
          attachments: true,
          _count: {
            select: {
              assignments: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        assignments: true,
        attachments: true,
        notifications: {
          orderBy: { created_at: "desc" },
          take: 10,
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Increment view count
    await this.prisma.job.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Only job owner can update
    if (job.customer_id !== userId) {
      throw new ForbiddenException("You can only update your own jobs");
    }

    // Cannot update if job is completed or cancelled
    if (
      job.status === JobStatus.COMPLETED ||
      job.status === JobStatus.CANCELLED
    ) {
      throw new ForbiddenException("Cannot update completed or cancelled jobs");
    }

    const updateData = {
      ...updateJobDto,
      scheduled_at: updateJobDto.scheduled_at
        ? new Date(updateJobDto.scheduled_at)
        : undefined,
      deadline: updateJobDto.deadline
        ? new Date(updateJobDto.deadline)
        : undefined,
      published_at:
        updateJobDto.status === JobStatus.OPEN ? new Date() : undefined,
    };

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        assignments: true,
      },
    });

    // Publish job.updated event
    if (updateJobDto.status) {
      this.eventPublisher.publishJobStatusChanged({
        jobId: updatedJob.id,
        customerId: updatedJob.customer_id,
        oldStatus: job.status,
        newStatus: updatedJob.status,
        updatedAt: updatedJob.updated_at,
      });
    }

    return updatedJob;
  }

  async remove(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Only job owner can delete
    if (job.customer_id !== userId) {
      throw new ForbiddenException("You can only delete your own jobs");
    }

    // Cannot delete if job is in progress
    if (job.status === JobStatus.IN_PROGRESS) {
      throw new ForbiddenException("Cannot delete jobs that are in progress");
    }

    await this.prisma.job.delete({
      where: { id },
    });

    return { message: "Job deleted successfully" };
  }

  async assignProvider(
    jobId: string,
    providerId: string,
    customerId: string,
    quoteAmount?: number,
    estimatedDuration?: string
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.customer_id !== customerId) {
      throw new ForbiddenException(
        "You can only assign providers to your own jobs"
      );
    }

    if (job.status !== JobStatus.OPEN) {
      throw new ForbiddenException(
        "Only open jobs can have providers assigned"
      );
    }

    // Create assignment
    const assignment = await this.prisma.jobAssignment.create({
      data: {
        job_id: jobId,
        provider_id: providerId,
        provider_email: "provider@example.com", // This should come from User Service
        quote_amount: quoteAmount,
        estimated_duration: estimatedDuration,
        status: AssignmentStatus.ASSIGNED,
      },
    });

    // Update job status
    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
      },
    });

    // Publish job.assigned event
    this.eventPublisher.publishJobAssigned({
      jobId: jobId,
      customerId: customerId,
      providerId: providerId,
      quoteAmount: quoteAmount,
      assignedAt: assignment.assigned_at,
    });

    return { job: updatedJob, assignment };
  }

  async completeJob(jobId: string, providerId: string) {
    const assignment = await this.prisma.jobAssignment.findFirst({
      where: {
        job_id: jobId,
        provider_id: providerId,
        status: AssignmentStatus.ASSIGNED,
      },
      include: { job: true },
    });

    if (!assignment) {
      throw new NotFoundException("Assignment not found or not authorized");
    }

    if (assignment.job.status !== JobStatus.IN_PROGRESS) {
      throw new ForbiddenException("Only jobs in progress can be completed");
    }

    // Update assignment status
    await this.prisma.jobAssignment.update({
      where: { id: assignment.id },
      data: {
        status: AssignmentStatus.COMPLETED,
        completed_at: new Date(),
      },
    });

    // Update job status
    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completed_at: new Date(),
      },
    });

    // Publish job.completed event
    this.eventPublisher.publishJobCompleted({
      jobId: jobId,
      customerId: assignment.job.customer_id,
      providerId: providerId,
      completedAt: updatedJob.completed_at,
    });

    return updatedJob;
  }

  async getJobsByCustomer(customerId: string, status?: JobStatus) {
    const where: any = { customer_id: customerId };
    if (status) where.status = status;

    return this.prisma.job.findMany({
      where,
      include: {
        assignments: true,
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getJobsByProvider(providerId: string, status?: AssignmentStatus) {
    const where: any = { provider_id: providerId };
    if (status) where.status = status;

    const assignments = await this.prisma.jobAssignment.findMany({
      where,
      include: {
        job: true,
      },
      orderBy: { assigned_at: "desc" },
    });

    return assignments.map((assignment) => ({
      ...assignment.job,
      assignment: {
        id: assignment.id,
        status: assignment.status,
        quote_amount: assignment.quote_amount,
        estimated_duration: assignment.estimated_duration,
        assigned_at: assignment.assigned_at,
        completed_at: assignment.completed_at,
      },
    }));
  }

  async searchNearbyJobs(
    lat: number,
    lng: number,
    radius: number = 10,
    category?: string
  ) {
    // Basic geospatial search - for production, use PostGIS
    const latRange = radius / 111;
    const lngRange = radius / (111 * Math.cos((lat * Math.PI) / 180));

    const where: any = {
      status: JobStatus.OPEN,
      location_lat: {
        gte: lat - latRange,
        lte: lat + latRange,
      },
      location_lng: {
        gte: lng - lngRange,
        lte: lng + lngRange,
      },
    };

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    return this.prisma.job.findMany({
      where,
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }
}
