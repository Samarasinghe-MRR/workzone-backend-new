import { IsString, IsOptional, IsBoolean, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty({ example: "Plumbing", description: "Category name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: "All kinds of plumbing related services",
    description: "Category description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: "uuid-of-parent-category",
    description: "Parent category ID for subcategories",
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether category is active",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: "Electrical Repairs" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "General electrical works" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "uuid-of-parent-category" })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryResponseDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "Plumbing" })
  name: string;

  @ApiPropertyOptional({ example: "All plumbing services" })
  description?: string;

  @ApiPropertyOptional({ example: "uuid-of-parent" })
  parentId?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2025-08-30T12:34:56Z" })
  createdAt: Date;

  @ApiProperty({ example: "2025-08-30T12:34:56Z" })
  updatedAt: Date;
}

export class CategoryTreeDto extends CategoryResponseDto {
  @ApiPropertyOptional({ type: [CategoryTreeDto] })
  children?: CategoryTreeDto[];
}
