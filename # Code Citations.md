# Code Citations

## License: unknown
https://github.com/peterblockman/nestjs-grpc-server/tree/5fcf845ad7393d15059aee24897c99731d2da4b5/src/main.ts

```
'@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.
```


## License: unknown
https://github.com/seclace/hello-microservices/tree/ad9c7a76886d6b5051632c9160ce7c30bbcfb195/apps/human-generator/src/main.ts

```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>
```


## License: unknown
https://github.com/panarama360/ss-backend/tree/cee657914fe70ca0551a3230f152eb5584d5b82f/apps/donation/src/main.ts

```
'@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport
```


## License: unknown
https://github.com/mahmudz/nestjs-rabbitmq/tree/e7e9cb71f74d8eb50a25ad7a856b607f9ab0c04d/admin-service/src/main.ts

```
core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ
```


## License: unknown
https://github.com/gevorg-dan/file-archiver/tree/42c74c5785d822e73fc18517caf6ec5e42bd2b15/secondary-back/src/main.ts

```
/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp:
```

