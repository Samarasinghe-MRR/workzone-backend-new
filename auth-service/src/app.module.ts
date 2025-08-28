import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
//import { ThrottlerModule } from '@nestjs/throttler';
//import { APP_GUARD } from '@nestjs/core';
//import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    UserModule,
    AdminModule,
    // ThrottlerModule.forRoot({
    //   ttl: 60, // time to live = 60s
    //   limit: 10, // max 10 requests per 60s per IP
    // }),
  ],

  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard, // 👈 Applies globally
    // },
  ],
})
export class AppModule {}
