import {
  Controller,
  Get,
  //Post,
  Patch,
  Param,
  Body,
  Delete,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  findUserById(@Param('id') id: string) {
    return this.userService.findUserById(id);
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
