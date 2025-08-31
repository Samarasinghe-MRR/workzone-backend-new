import { Injectable, Logger } from "@nestjs/common";
import { ClientProxy, Client, Transport } from "@nestjs/microservices";
import {
  JobCreatedEvent,
  JobStatusChangedEvent,
  JobAssignedEvent,
  JobCompletedEvent,
  QuoteAcceptedEvent,
  QuoteRejectedEvent,
} from "./job-events.interface";

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  @Client({
    transport: Transport.RMQ,
    options: {
      urls: ["amqp://localhost:5672"],
      queue: "job_events",
      queueOptions: {
        durable: true,
      },
    },
  })
  private client: ClientProxy;

  async publishJobCreated(event: JobCreatedEvent) {
    try {
      this.logger.log(`Publishing job created event for job ${event.jobId}`);
      await this.client.emit("job.created", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish job created event: ${error.message}`
      );
    }
  }

  async publishJobStatusChanged(event: JobStatusChangedEvent) {
    try {
      this.logger.log(
        `Publishing job status changed event for job ${event.jobId}`
      );
      await this.client.emit("job.status.changed", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish job status changed event: ${error.message}`
      );
    }
  }

  async publishJobAssigned(event: JobAssignedEvent) {
    try {
      this.logger.log(`Publishing job assigned event for job ${event.jobId}`);
      await this.client.emit("job.assigned", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish job assigned event: ${error.message}`
      );
    }
  }

  async publishJobCompleted(event: JobCompletedEvent) {
    try {
      this.logger.log(`Publishing job completed event for job ${event.jobId}`);
      await this.client.emit("job.completed", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish job completed event: ${error.message}`
      );
    }
  }

  async publishQuoteAccepted(event: QuoteAcceptedEvent) {
    try {
      this.logger.log(`Publishing quote accepted event for job ${event.jobId}`);
      await this.client.emit("quote.accepted", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish quote accepted event: ${error.message}`
      );
    }
  }

  async publishQuoteRejected(event: QuoteRejectedEvent) {
    try {
      this.logger.log(`Publishing quote rejected event for job ${event.jobId}`);
      await this.client.emit("quote.rejected", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish quote rejected event: ${error.message}`
      );
    }
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
