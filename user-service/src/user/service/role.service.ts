import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(name: string) {
    return this.prisma.role.create({ data: { name } });
  }

  async findRoleByName(name: string) {
    return this.prisma.role.findFirst({ where: { name } });
  }

  async getAllRoles() {
    return this.prisma.role.findMany();
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });
  }
}
