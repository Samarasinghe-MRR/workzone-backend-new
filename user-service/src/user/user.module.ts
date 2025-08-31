import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { RoleService } from './service/role.service';
import { ProfileService } from './service/profile.service';
import { CustomerDataAggregationService } from './service/customer-data-aggregation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserGrpcController } from './controller/user-grpc.controller';
import { UserEventController } from '../events/user.events';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtUtilService } from '../common/jwt-util.service';

@Module({
  imports: [
    PrismaModule, // 💡 Import Prisma to enable DB access
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserController, UserGrpcController, UserEventController],
  providers: [
    UserService,
    RoleService,
    ProfileService,
    CustomerDataAggregationService,
    JwtUtilService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    UserService,
    RoleService,
    ProfileService,
    CustomerDataAggregationService,
    JwtUtilService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class UserModule {}
