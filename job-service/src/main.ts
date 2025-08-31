import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MicroserviceOptions } from "@nestjs/microservices";
import { RabbitMQConfig } from "./events/rabbitmq.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Configure RabbitMQ microservice for event consumption
  app.connectMicroservice<MicroserviceOptions>(RabbitMQConfig);

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle("WorkZone Job Service")
    .setDescription(
      "API documentation for WorkZone Job Management microservice"
    )
    .setVersion("1.0")
    .addTag("jobs")
    .addTag("categories")
    .addTag("applications")
    .addTag("bids")
    .addTag("service-providers")
    .addTag("reviews")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // Start both HTTP and RabbitMQ microservice
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);

  console.log("🚀 Job Service running on port 3002");
  console.log("📝 Swagger documentation: http://localhost:3002/api");
  console.log("🐰 RabbitMQ microservice connected for event consumption");
}

bootstrap().catch(console.error);
