import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("API Gateway");

  // Security middleware
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    methods: process.env.CORS_METHODS?.split(",") || [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
    ],
    credentials: process.env.CORS_CREDENTIALS === "true",
  });

  // API prefix
  app.setGlobalPrefix("api");

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("WorkZone API Gateway")
    .setDescription("Central API Gateway for WorkZone microservices")
    .setVersion("1.0")
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
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management endpoints")
    .addTag("jobs", "Job management endpoints")
    .addTag("quotations", "Quotation management endpoints")
    .addTag("health", "Health check endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start the application
  const port = process.env.PORT || 8080;
  await app.listen(port);

  logger.log(`🚀 API Gateway running on port ${port}`);
  logger.log(
    `📚 Swagger documentation available at http://localhost:${port}/api/docs`
  );
  logger.log(`🔗 Available services:`);
  logger.log(`   - Auth Service: ${process.env.AUTH_SERVICE_URL}`);
  logger.log(`   - User Service: ${process.env.USER_SERVICE_URL}`);
  logger.log(`   - Job Service: ${process.env.JOB_SERVICE_URL}`);
  logger.log(`   - Quotation Service: ${process.env.QUOTATION_SERVICE_URL}`);
}

bootstrap().catch((error) => {
  Logger.error("Failed to start API Gateway", error);
  process.exit(1);
});
