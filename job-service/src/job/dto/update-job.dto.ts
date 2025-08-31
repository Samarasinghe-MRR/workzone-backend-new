import { PartialType } from "@nestjs/swagger";
import { CreateJobDto } from "./create-job.dto";
import { IsOptional, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { JobStatus } from "../../../generated/prisma";

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @ApiPropertyOptional({ description: "Job status", enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
