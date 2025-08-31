import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsEmail,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { JobPriority } from "../../../generated/prisma";

export class CreateJobDto {
  @ApiProperty({ description: "Job title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Job description" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "Job category (e.g., Plumbing, Electrical, Cleaning)",
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: "Job location address" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: "Latitude coordinate" })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  location_lat?: number;

  @ApiPropertyOptional({ description: "Longitude coordinate" })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  location_lng?: number;

  @ApiPropertyOptional({ description: "Minimum budget" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_min?: number;

  @ApiPropertyOptional({ description: "Maximum budget" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_max?: number;

  @ApiPropertyOptional({ description: "Currency", default: "LKR" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: "When customer wants job done" })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({ description: "Latest completion date" })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: "Job priority", enum: JobPriority })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional({ description: "Customer special instructions" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Technical requirements" })
  @IsOptional()
  @IsString()
  requirements?: string;

  // These will be set from JWT token
  customer_id?: string;
  customer_email?: string;
}
