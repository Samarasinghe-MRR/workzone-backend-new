import { IsNotEmpty } from 'class-validator';

export class CreateCustomerProfileDto {
  @IsNotEmpty()
  address: string;
}
