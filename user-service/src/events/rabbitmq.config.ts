import { Transport, RmqOptions } from '@nestjs/microservices';

export const RabbitMQConfig: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
    queue: 'user_events',
    queueOptions: {
      durable: true,
    },
  },
};

export const USER_EVENTS = {
  USER_CREATED: 'user.created',
  USER_VERIFIED: 'user.verified',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  PASSWORD_CHANGED: 'password.changed',
} as const;
