import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';

export class CreateUserProfileDto {
  @IsNotEmpty()
  authUserId: string; // Link to Auth Service User.id

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('LK')
  phone: string;

  @IsNotEmpty()
  roleId: string;

  @IsOptional()
  isVerified?: boolean;
}
