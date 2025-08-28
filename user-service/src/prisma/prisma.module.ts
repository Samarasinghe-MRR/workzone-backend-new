import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
// This module provides the PrismaService globally, allowing it to be injected into other modules without needing to import it each time.
// The PrismaService is responsible for managing the Prisma client and database interactions.
// The @Global() decorator makes this module available throughout the application, so you don't need to import it in every module that needs access to the PrismaService.
// The PrismaService is exported so that it can be used in other modules that import the PrismaModule.
// This setup is useful for maintaining a single instance of the Prisma client across the application, ensuring efficient database connections and operations.
