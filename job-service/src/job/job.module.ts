import { Module } from "@nestjs/common";
import { JobService } from "./job.service";
import { JobController } from "./job.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [PrismaModule, AuthModule, EventsModule],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
