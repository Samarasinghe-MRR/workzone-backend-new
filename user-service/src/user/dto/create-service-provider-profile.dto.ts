import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  //Max,
} from 'class-validator';

export class CreateServiceProviderProfileDto {
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0)
  experienceYears: number;

  @IsNotEmpty()
  @IsString()
  location: string; // Should be a string like "latitude,longitude" or JSON

  @IsBoolean()
  availability: boolean;
}
