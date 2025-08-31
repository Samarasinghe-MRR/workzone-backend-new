import { Injectable, Logger } from "@nestjs/common";
import { QuotationService } from "../quotation/quotation.service";
import { InvitationService } from "../invitation/invitation.service";
import { JobCreatedEvent } from "./quote-events.interface";

@Injectable()
export class EventConsumerService {
  private readonly logger = new Logger(EventConsumerService.name);

  constructor(
    private readonly quotationService: QuotationService,
    private readonly invitationService: InvitationService
  ) {}

  async handleJobCreatedEvent(jobData: JobCreatedEvent) {
    try {
      this.logger.log(`Processing job.created event for job ${jobData.jobId}`);

      // Use existing invitation service method - map to expected interface
      await this.invitationService.handleJobCreated({
        job_id: jobData.jobId,
        customer_id: jobData.customerId,
        title: jobData.title,
        category: jobData.category,
        description: `${jobData.title} - Budget: ${jobData.budget_min || 0} - ${jobData.budget_max || 0}`,
        location: {
          address: jobData.location || "Unknown location",
          latitude: jobData.location_lat || 0,
          longitude: jobData.location_lng || 0,
        },
        budget: jobData.budget_max || jobData.budget_min || 0,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
        requirements: {
          requires_tools: false,
          eco_friendly_only: false,
          emergency: false,
        },
      });

      this.logger.log(
        `Successfully processed job.created event for job ${jobData.jobId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to process job.created event: ${error.message}`
      );
    }
  }

  async handleJobCancelledEvent(jobData: any) {
    try {
      this.logger.log(`Processing job.cancelled event for job ${jobData.id}`);

      // When a job is cancelled, we should cancel all pending quotations
      await this.quotationService.cancelQuotationsByJobId(jobData.id);

      this.logger.log(`Cancelled all pending quotations for job ${jobData.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process job.cancelled event: ${error.message}`
      );
    }
  }

  async handleJobUpdatedEvent(jobData: any) {
    try {
      this.logger.log(`Processing job.updated event for job ${jobData.id}`);

      // Handle job updates that might affect quotations
      // For example, if job requirements change, notify providers with pending quotes

      this.logger.log(`Processed job update for job ${jobData.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process job.updated event: ${error.message}`
      );
    }
  }
}
