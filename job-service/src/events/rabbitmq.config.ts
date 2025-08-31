import { Transport, RmqOptions } from "@nestjs/microservices";

export const RabbitMQConfig: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
    queue: "job_events",
    queueOptions: {
      durable: true,
    },
  },
};

export const JOB_EVENTS = {
  JOB_CREATED: "job.created",
  JOB_UPDATED: "job.updated",
  JOB_STATUS_CHANGED: "job.status.changed",
  JOB_ASSIGNED: "job.assigned",
  JOB_COMPLETED: "job.completed",
  JOB_CANCELLED: "job.cancelled",
  QUOTE_ACCEPTED: "quote.accepted",
  QUOTE_REJECTED: "quote.rejected",
} as const;
