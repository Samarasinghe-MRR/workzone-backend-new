import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions } from '@nestjs/microservices';
import { RabbitMQConfig } from './events/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Configure RabbitMQ microservice for event consumption
  app.connectMicroservice<MicroserviceOptions>(RabbitMQConfig);

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('WorkZone User Service')
    .setDescription('API documentation for WorkZone User microservice')
    .setVersion('1.0')
    .addTag('users')
    .addTag('profiles')
    .addTag('roles')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start both HTTP and RabbitMQ microservice
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);

  console.log('🚀 User Service running on port 3001');
  console.log('🐰 RabbitMQ microservice connected for event consumption');
}
bootstrap().catch(console.error);
