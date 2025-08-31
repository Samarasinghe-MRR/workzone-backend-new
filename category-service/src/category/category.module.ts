import { Module } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { JwtUtilService } from "../common/jwt-util.service";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [EventsModule],
  controllers: [CategoryController],
  providers: [CategoryService, JwtUtilService],
  exports: [CategoryService],
})
export class CategoryModule {}
