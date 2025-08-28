import { IsEmail, IsNotEmpty, Length, IsPhoneNumber } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('LK') // 'LK' is for Sri Lanka (change as needed)
  phone: string;

  @Length(6, 32)
  password: string;

  @IsNotEmpty()
  roleId: string;
  authUserId: string;
}
