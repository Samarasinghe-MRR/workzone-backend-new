import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Add your frontend URLs
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle(process.env.API_TITLE || "WorkZone Quotation Service")
    .setDescription(
      process.env.API_DESCRIPTION ||
        "Handles provider quotations and customer acceptance"
    )
    .setVersion(process.env.API_VERSION || "1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // RabbitMQ microservice for event handling
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
      queue: process.env.RABBITMQ_QUEUE_QUOTES || "quote_events",
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3004;
  await app.listen(port);

  console.log(`🚀 Quotation Service running on port ${port}`);
  console.log(`📝 Swagger documentation: http://localhost:${port}/api`);
  console.log(`🐰 RabbitMQ microservice connected for event handling`);
}

bootstrap();
