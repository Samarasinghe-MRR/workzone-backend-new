import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
// This DTO is used to validate the email input for the forgot password functionality.
// It ensures that the email provided is in a valid format before processing the request.
