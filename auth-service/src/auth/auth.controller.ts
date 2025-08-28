import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
//import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
      registerDto.phone,
      registerDto.role, // optional, can be undefined and will default to 'CUSTOMER'
    );
  }

  //@Throttle(5, 60) // Limit to 5 requests per minute
  // @Post('login')
  // async login(@Body() loginDto: LoginDto) {
  //   const user = await this.authService.validateUser(
  //     loginDto.email,
  //     loginDto.password,
  //   );

  //   if (!user) throw new UnauthorizedException('Invalid credentials');

  //   return this.authService.login(user);
  // }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  login(@Body() loginDto: LoginDto) {
    return this.authService
      .validateUser(loginDto.email, loginDto.password)
      .then((user) => {
        if (!user) throw new Error('Invalid credentials');
        return this.authService.login(user);
      });
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify email' })
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // @Get('google')
  // @UseGuards(AuthGuard('google'))
  // googleAuth() {
  //   // Redirects to Google login
  // }

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // googleAuthRedirect(@Req() req) {
  //   return this.authService.socialLogin(req.user);
  // }
  @Get('google')
  @ApiOperation({ summary: 'Login with Google' })
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // redirects to Google OAuth
  }

  @Get('google/redirect')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @UseGuards(AuthGuard('google'))
  async googleRedirect(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const user = await this.authService.validateOrCreateGoogleUser(req.user);
    return this.authService.login(user); // returns JWT
  }
}
