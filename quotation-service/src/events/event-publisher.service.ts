import { Injectable, Logger } from "@nestjs/common";
import { ClientProxy, Client, Transport } from "@nestjs/microservices";
import {
  QuoteSubmittedEvent,
  QuoteAcceptedEvent,
  QuoteRejectedEvent,
  QuoteCancelledEvent,
  QuotationInviteSentEvent,
  InvitationResponseEvent,
  ProvidersMatchedEvent,
} from "./quote-events.interface";

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  @Client({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
      queue: process.env.RABBITMQ_QUEUE_QUOTES || "quote_events",
      queueOptions: {
        durable: true,
      },
    },
  })
  private client: ClientProxy;

  async publishQuoteSubmitted(event: QuoteSubmittedEvent) {
    try {
      this.logger.log(
        `Publishing quote submitted event for quote ${event.quoteId}`
      );
      await this.client.emit("quote.submitted", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish quote submitted event: ${error.message}`
      );
    }
  }

  async publishQuoteAccepted(event: QuoteAcceptedEvent) {
    try {
      this.logger.log(
        `Publishing quote accepted event for quote ${event.quoteId}`
      );
      await this.client.emit("quote.accepted", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish quote accepted event: ${error.message}`
      );
    }
  }

  async publishQuoteRejected(event: QuoteRejectedEvent) {
    try {
      this.logger.log(
        `Publishing quote rejected event for quote ${event.quoteId}`
      );
      await this.client.emit("quote.rejected", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish quote rejected event: ${error.message}`
      );
    }
  }

  async publishQuoteCancelled(event: QuoteCancelledEvent) {
    try {
      this.logger.log(
        `Publishing quote cancelled event for quote ${event.quoteId}`
      );
      await this.client.emit("quote.cancelled", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish quote cancelled event: ${error.message}`
      );
    }
  }

  // New invitation-related events
  async publishInvitationSent(event: QuotationInviteSentEvent) {
    try {
      this.logger.log(
        `Publishing invitation sent event for invitation ${event.invitationId}`
      );
      await this.client.emit("invitation.sent", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish invitation sent event: ${error.message}`
      );
    }
  }

  async publishInvitationResponse(event: InvitationResponseEvent) {
    try {
      this.logger.log(
        `Publishing invitation response event for invitation ${event.invitationId}`
      );
      await this.client.emit("invitation.response", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish invitation response event: ${error.message}`
      );
    }
  }

  async publishProvidersMatched(event: ProvidersMatchedEvent) {
    try {
      this.logger.log(
        `Publishing providers matched event for job ${event.jobId}`
      );
      await this.client.emit("providers.matched", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish providers matched event: ${error.message}`
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
