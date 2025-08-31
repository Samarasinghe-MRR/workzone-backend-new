import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateQuotationDto {
  @ApiProperty({ description: "Job ID this quote is for" })
  @IsString()
  @IsNotEmpty()
  job_id: string;

  @ApiProperty({ description: "Quoted price for the job" })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Estimated time to complete (e.g., "2 hours", "1 day")',
  })
  @IsOptional()
  @IsString()
  estimated_time?: string;

  @ApiPropertyOptional({
    description: "Provider message/notes for the customer",
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: "When provider can start the job" })
  @IsOptional()
  @IsDateString()
  proposed_start?: string;

  @ApiPropertyOptional({
    description: "Provider includes tools/equipment",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includes_tools?: boolean;

  @ApiPropertyOptional({
    description: "Eco-friendly service option",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  eco_friendly?: boolean;

  @ApiPropertyOptional({ description: "Quote validity expiry date" })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional({
    description: 'Warranty period (e.g., "1 year", "6 months")',
  })
  @IsOptional()
  @IsString()
  warranty_period?: string;

  @ApiPropertyOptional({ description: "Separate materials cost" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  materials_cost?: number;

  @ApiPropertyOptional({ description: "Separate labor cost" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  labor_cost?: number;

  // These will be set from JWT token
  provider_id?: string;
  provider_email?: string;
}
