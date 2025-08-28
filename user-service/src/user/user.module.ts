import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { RoleService } from './service/role.service';
import { ProfileService } from './service/profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserGrpcController } from './controller/user-grpc.controller';
import { UserEventController } from '../events/user.events';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [PrismaModule], // 💡 Import Prisma to enable DB access
  controllers: [UserController, UserGrpcController, UserEventController],
  providers: [
    UserService,
    RoleService,
    ProfileService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [UserService, RoleService, ProfileService, JwtAuthGuard, RolesGuard],
})
export class UserModule {}
