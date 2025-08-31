import { PartialType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateQuotationDto } from "./create-quotation.dto";

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {
  @IsOptional()
  @IsString()
  customer_notes?: string; // Customer can add notes when accepting/rejecting
}
