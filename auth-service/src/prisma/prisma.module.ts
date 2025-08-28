import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Make it globally available
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
// This module provides the PrismaService globally, allowing it to be injected into other modules without needing to import the PrismaModule each time.
// The `@Global()` decorator ensures that the PrismaService can be used across the application without needing to import the PrismaModule in every module that requires it.
// The `exports` array allows other modules to use the PrismaService without needing to import the PrismaModule explicitly, as long as they are part of the same application context.
// This is particularly useful in larger applications where you want to keep the PrismaService available throughout the application without repetitive imports.
