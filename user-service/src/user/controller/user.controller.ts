import {
  Controller,
  Get,
  //Post,
  Patch,
  Param,
  Body,
  Delete,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtUtilService } from '../../common/jwt-util.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtUtil: JwtUtilService,
  ) {}

  @Get(':id')
  findUserById(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }

  // 🔑 NEW: Get current user's data based on JWT token
  @Get('me')
  getCurrentUser(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = this.jwtUtil.validateTokenAndGetUser(token);

    if (!userInfo) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Return the current user's data based on their role
    return this.userService.findUserById(userInfo.userId);
  }

  // 🎯 NEW: Get current user's dashboard data (role-specific)
  @Get('me/dashboard')
  getCurrentUserDashboard(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = this.jwtUtil.validateTokenAndGetUser(token);

    if (!userInfo) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Return role-specific dashboard data
    switch (userInfo.role.toUpperCase()) {
      case 'CUSTOMER':
        return this.userService.getCustomerComprehensiveData(
          userInfo.userId,
          token,
        );
      case 'SERVICE_PROVIDER':
        return this.userService.getProviderComprehensiveData(
          userInfo.userId,
          token,
        );
      case 'ADMIN':
        // For now, return basic user data + admin stats
        return this.userService.findUserById(userInfo.userId);
      default:
        return this.userService.findUserById(userInfo.userId);
    }
  }

  // NEW: Get comprehensive customer data from all microservices
  @Get(':id/customer-data')
  getCustomerComprehensiveData(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    // Extract token from authorization header
    const token = authHeader?.replace('Bearer ', '');
    return this.userService.getCustomerComprehensiveData(id, token);
  }

  // NEW: Get comprehensive provider data from all microservices
  @Get(':id/provider-data')
  getProviderComprehensiveData(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    // Extract token from authorization header
    const token = authHeader?.replace('Bearer ', '');
    return this.userService.getProviderComprehensiveData(id, token);
  }

  @Get('email/:email')
  findUserByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() data: Partial<CreateUserDto>) {
    return this.userService.updateUser(id, data);
  }

  @Delete(':id')
  softDeleteUser(@Param('id') id: string) {
    return this.userService.softDeleteUser(id);
  }

  @Get()
  listActiveUsers() {
    return this.userService.listActiveUsers();
  }
}
