import { Module } from '@nestjs/common';
import { UserController } from '../controller/user.controller';
import { UserService } from '../service/user.service';
import { RoleService } from '../service/role.service';
import { RoleController } from '../controller/role.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Global PrismaService module

@Module({
  imports: [PrismaModule], // 💡 Import Prisma to enable DB access
  controllers: [UserController, RoleController],
  providers: [UserService, RoleService],
  exports: [UserService, RoleService], // 👈 Export if needed in Auth or other modules
})
export class UserModule {}
