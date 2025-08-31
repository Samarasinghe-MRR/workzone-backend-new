import { Module, forwardRef } from "@nestjs/common";
import { QuotationService } from "./quotation.service";
import { QuotationController } from "./quotation.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [PrismaModule, forwardRef(() => EventsModule)],
  controllers: [QuotationController],
  providers: [QuotationService],
  exports: [QuotationService],
})
export class QuotationModule {}
