import { Module, forwardRef } from "@nestjs/common";
import { EventPublisherService } from "./event-publisher.service";
import { EventConsumerService } from "./event-consumer.service";
import { QuotationModule } from "../quotation/quotation.module";

@Module({
  imports: [forwardRef(() => QuotationModule)],
  providers: [EventPublisherService, EventConsumerService],
  exports: [EventPublisherService, EventConsumerService],
})
export class EventsModule {}
