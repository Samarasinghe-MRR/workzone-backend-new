import { IsOptional, IsEmail, IsPhoneNumber, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('LK')
  phone?: string;

  @IsOptional()
  @Length(6, 32)
  password?: string;
}
