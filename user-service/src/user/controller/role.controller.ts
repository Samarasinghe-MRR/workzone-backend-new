import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { RoleService } from '../service/role.service';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  createRole(@Body('name') name: string) {
    return this.roleService.createRole(name);
  }

  @Get()
  getAllRoles() {
    return this.roleService.getAllRoles();
  }

  @Get(':name')
  findRoleByName(@Param('name') name: string) {
    return this.roleService.findRoleByName(name);
  }

  @Post('assign')
  assignRole(@Body('userId') userId: string, @Body('roleId') roleId: string) {
    return this.roleService.assignRole(userId, roleId);
  }
}
