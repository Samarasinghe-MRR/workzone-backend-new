import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes extra properties
      forbidNonWhitelisted: true, // throws error for unexpected props
      transform: true, // transforms types based on DTO
    }),
  );

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('Handles registration and login')
    .setVersion('1.0')
    .addBearerAuth() // For JWT-protected routes
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Access at /api
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
