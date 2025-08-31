import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface NearbyProvider {
  id: string;
  email: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  rating: number;
}

export interface JobCreatedEvent {
  job_id: string;
  customer_id: string;
  title: string;
  category: string;
  description: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  budget?: number;
  deadline?: string;
  requirements: {
    requires_tools?: boolean;
    eco_friendly_only?: boolean;
    emergency?: boolean;
  };
}

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService
  ) {}

  /**
   * Main entry point: Handle job.created event and invite eligible providers
   */
  async handleJobCreated(event: JobCreatedEvent): Promise<void> {
    this.logger.log(`Processing job created: ${event.job_id}`);

    try {
      // 1. Create eligibility criteria
      const criteria = await this.createEligibilityCriteria(event);

      // 2. Find nearby eligible providers
      const eligibleProviders = await this.findEligibleProviders(
        event,
        criteria
      );

      // 3. Create invitations for eligible providers
      const invitations = await this.createInvitations(
        event,
        eligibleProviders
      );

      // 4. Emit invitation events
      await this.emitInvitationEvents(invitations, event);

      this.logger.log(
        `Successfully invited ${invitations.length} providers for job ${event.job_id}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to process job created event: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Create eligibility criteria based on job requirements
   */
  private async createEligibilityCriteria(event: JobCreatedEvent) {
    const defaultRadius = event.requirements.emergency ? 5.0 : 10.0;
    const defaultExpiry = event.requirements.emergency ? 2 : 24;
    const maxProviders = event.requirements.emergency ? 5 : 10;

    return await this.prisma.jobEligibilityCriteria.create({
      data: {
        job_id: event.job_id,
        required_category: event.category,
        max_distance_km: defaultRadius,
        max_providers_invited: maxProviders,
        invite_expires_hours: defaultExpiry,
        job_latitude: event.location.latitude,
        job_longitude: event.location.longitude,
        job_address: event.location.address,
        deadline: event.deadline ? new Date(event.deadline) : null,
        requires_tools: event.requirements.requires_tools || false,
        eco_friendly_only: event.requirements.eco_friendly_only || false,
        emergency_job: event.requirements.emergency || false,
      },
    });
  }

  /**
   * Query User Service for nearby providers
   */
  private async findEligibleProviders(
    event: JobCreatedEvent,
    criteria: any
  ): Promise<NearbyProvider[]> {
    const userServiceUrl =
      process.env.USER_SERVICE_URL || "http://localhost:3001";

    const params = {
      category: criteria.required_category,
      lat: criteria.job_latitude,
      lng: criteria.job_longitude,
      radius: criteria.max_distance_km,
      limit: criteria.max_providers_invited,
      min_rating: criteria.min_provider_rating || 0,
      eco_friendly: criteria.eco_friendly_only,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${userServiceUrl}/providers/nearby`, { params })
      );

      this.logger.log(`Found ${response.data.length} eligible providers`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch nearby providers: ${error.message}`);
      throw new Error("Unable to fetch eligible providers");
    }
  }

  /**
   * Create invitation records for eligible providers
   */
  private async createInvitations(
    event: JobCreatedEvent,
    providers: NearbyProvider[]
  ) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Default 24 hours

    const invitations = await Promise.all(
      providers.map(async (provider) => {
        return await this.prisma.jobQuotationInvite.create({
          data: {
            job_id: event.job_id,
            provider_id: provider.id,
            provider_email: provider.email,
            job_category: event.category,
            distance_km: provider.distance_km,
            expires_at: expiresAt,
            job_title: event.title,
            job_location: event.location.address,
            customer_id: event.customer_id,
          },
        });
      })
    );

    // Update metrics for each provider
    await Promise.all(
      providers.map(async (provider) => {
        await this.updateProviderMetrics(provider.id, "invite");
      })
    );

    return invitations;
  }

  /**
   * Emit invitation events for each provider
   */
  private async emitInvitationEvents(
    invitations: any[],
    event: JobCreatedEvent
  ) {
    await Promise.all(
      invitations.map(async (invitation) => {
        await this.prisma.quoteEvent.create({
          data: {
            event_type: "QUOTE_INVITED",
            invite_id: invitation.id,
            job_id: event.job_id,
            provider_id: invitation.provider_id,
            customer_id: event.customer_id,
            payload: {
              job_title: event.title,
              job_category: event.category,
              distance_km: invitation.distance_km,
              expires_at: invitation.expires_at,
              job_location: event.location.address,
              estimated_budget: event.budget,
              emergency: event.requirements.emergency,
            },
          },
        });
      })
    );
  }

  /**
   * Handle provider quote submission
   */
  async handleQuoteSubmission(inviteId: string, quoteData: any): Promise<void> {
    const invitation = await this.prisma.jobQuotationInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "INVITED") {
      throw new Error("Invitation is no longer active");
    }

    // Calculate response time
    const responseTimeHours = Math.ceil(
      (new Date().getTime() - invitation.invited_at.getTime()) /
        (1000 * 60 * 60)
    );

    // Create quotation
    const quotation = await this.prisma.quotation.create({
      data: {
        ...quoteData,
        invite_id: inviteId,
        job_id: invitation.job_id,
        provider_id: invitation.provider_id,
        response_time_hours: responseTimeHours,
      },
    });

    // Update invitation status
    await this.prisma.jobQuotationInvite.update({
      where: { id: inviteId },
      data: {
        responded: true,
        response_at: new Date(),
        status: "RESPONDED",
      },
    });

    // Update provider metrics
    await this.updateProviderMetrics(invitation.provider_id, "response");

    // Emit quote submitted event
    await this.prisma.quoteEvent.create({
      data: {
        event_type: "QUOTE_SUBMITTED",
        quote_id: quotation.id,
        invite_id: inviteId,
        job_id: invitation.job_id,
        provider_id: invitation.provider_id,
        customer_id: invitation.customer_id,
        payload: {
          price: quotation.price,
          estimated_time: quotation.estimated_time,
          response_time_hours: responseTimeHours,
        },
      },
    });

    this.logger.log(
      `Quote submitted for job ${invitation.job_id} by provider ${invitation.provider_id}`
    );
  }

  /**
   * Update provider metrics
   */
  private async updateProviderMetrics(
    providerId: string,
    action: "invite" | "response" | "accept" | "reject"
  ) {
    const metrics = await this.prisma.quotationMetrics.upsert({
      where: { provider_id: providerId },
      create: {
        provider_id: providerId,
        total_invites: action === "invite" ? 1 : 0,
        total_responses: action === "response" ? 1 : 0,
        accepted_quotes: action === "accept" ? 1 : 0,
        rejected_quotes: action === "reject" ? 1 : 0,
      },
      update: {
        total_invites: action === "invite" ? { increment: 1 } : undefined,
        total_responses: action === "response" ? { increment: 1 } : undefined,
        accepted_quotes: action === "accept" ? { increment: 1 } : undefined,
        rejected_quotes: action === "reject" ? { increment: 1 } : undefined,
        updated_at: new Date(),
      },
    });

    // Recalculate rates
    if (metrics.total_invites > 0) {
      const responseRate =
        (metrics.total_responses / metrics.total_invites) * 100;
      const successRate =
        metrics.total_responses > 0
          ? (metrics.accepted_quotes / metrics.total_responses) * 100
          : 0;

      await this.prisma.quotationMetrics.update({
        where: { provider_id: providerId },
        data: {
          response_rate: responseRate,
          success_rate: successRate,
        },
      });
    }
  }

  /**
   * Get provider invitations
   */
  async getProviderInvitations(providerId: string, status?: string) {
    // Import InviteStatus from your Prisma client if not already imported
    // import { InviteStatus } from '@prisma/client';

    return await this.prisma.jobQuotationInvite.findMany({
      where: {
        provider_id: providerId,
        status: status ? (status as any) : undefined, // Cast to correct enum type
      },
      orderBy: {
        invited_at: "desc",
      },
    });
  }

  /**
   * Get job invitation statistics
   */
  async getJobInvitationStats(jobId: string) {
    const invitations = await this.prisma.jobQuotationInvite.findMany({
      where: { job_id: jobId },
    });

    const stats = {
      total_invited: invitations.length,
      responded: invitations.filter((i) => i.responded).length,
      pending: invitations.filter((i) => i.status === "INVITED").length,
      expired: invitations.filter((i) => i.status === "EXPIRED").length,
      average_distance:
        invitations.reduce((sum, i) => sum + (i.distance_km || 0), 0) /
        invitations.length,
    };

    return stats;
  }
}
