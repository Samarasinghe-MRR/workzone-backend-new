import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
//import { AppController } from './app.controller';
//import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
//import { UserController } from './user/controller/user.controller';
//import { ProfileController } from './user/controller/profile.controller';
import { RoleController } from './user/controller/role.controller';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { ProfileService } from './user/service/profile.service';
import { RoleService } from './user/service/role.service';
import { JwtStrategy } from './user/strategies/jwt.strategy';
//import { UserService } from './user/service/user.service';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AppController, RoleController], // Only AppController here
  providers: [AppService, RoleService, JwtStrategy], // Add JwtStrategy
})
export class AppModule {}
