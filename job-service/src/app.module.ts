import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { JobModule } from "./job/job.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [PrismaModule, AuthModule, EventsModule, JobModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
