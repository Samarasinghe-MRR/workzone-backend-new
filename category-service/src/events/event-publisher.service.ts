import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ClientProxy, Client, Transport } from "@nestjs/microservices";
import {
  CategoryCreatedEvent,
  CategoryUpdatedEvent,
  CategoryDeletedEvent,
} from "./category-events.interface";

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);

  @Client({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
      queue: "category_events",
      queueOptions: {
        durable: true,
      },
    },
  })
  private client: ClientProxy;

  async onModuleInit() {
    await this.client.connect();
    this.logger.log("Connected to RabbitMQ for category events");
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  async publishCategoryCreated(event: CategoryCreatedEvent) {
    try {
      this.logger.log(`Publishing category.created event for: ${event.name}`);
      await this.client.emit("category.created", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish category.created event: ${error.message}`
      );
    }
  }

  async publishCategoryUpdated(event: CategoryUpdatedEvent) {
    try {
      this.logger.log(`Publishing category.updated event for: ${event.name}`);
      await this.client.emit("category.updated", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish category.updated event: ${error.message}`
      );
    }
  }

  async publishCategoryDeleted(event: CategoryDeletedEvent) {
    try {
      this.logger.log(`Publishing category.deleted event for: ${event.name}`);
      await this.client.emit("category.deleted", event);
    } catch (error) {
      this.logger.error(
        `Failed to publish category.deleted event: ${error.message}`
      );
    }
  }
}
