import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { RabbitMQConfig, USER_EVENTS } from './rabbitmq.config';
import {
  UserCreatedEvent,
  UserVerifiedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
} from './user-events.interface';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private rabbitMQClient: ClientProxy;

  constructor() {
    this.rabbitMQClient = ClientProxyFactory.create(RabbitMQConfig);
  }

  async onModuleInit() {
    try {
      await this.rabbitMQClient.connect();
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
    }
  }

  publishUserCreated(data: UserCreatedEvent): void {
    try {
      this.rabbitMQClient.emit(USER_EVENTS.USER_CREATED, data);
      this.logger.log(`Published user.created event for user: ${data.email}`);
    } catch (error) {
      this.logger.error('Failed to publish user.created event:', error);
    }
  }

  publishUserVerified(data: UserVerifiedEvent): void {
    try {
      this.rabbitMQClient.emit(USER_EVENTS.USER_VERIFIED, data);
      this.logger.log(`Published user.verified event for user: ${data.email}`);
    } catch (error) {
      this.logger.error('Failed to publish user.verified event:', error);
    }
  }

  publishUserUpdated(data: UserUpdatedEvent): void {
    try {
      this.rabbitMQClient.emit(USER_EVENTS.USER_UPDATED, data);
      this.logger.log(`Published user.updated event for user: ${data.email}`);
    } catch (error) {
      this.logger.error('Failed to publish user.updated event:', error);
    }
  }

  publishUserDeleted(data: UserDeletedEvent): void {
    try {
      this.rabbitMQClient.emit(USER_EVENTS.USER_DELETED, data);
      this.logger.log(`Published user.deleted event for user: ${data.email}`);
    } catch (error) {
      this.logger.error('Failed to publish user.deleted event:', error);
    }
  }

  async onModuleDestroy() {
    if (this.rabbitMQClient) {
      await this.rabbitMQClient.close();
      this.logger.log('Disconnected from RabbitMQ');
    }
  }
}
