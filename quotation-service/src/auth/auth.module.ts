import { Global, Module } from "@nestjs/common";
import { AuthClientService } from "./auth-client.service";
import { CentralizedAuthGuard } from "./guards/centralized-auth.guard";

@Global()
@Module({
  providers: [AuthClientService, CentralizedAuthGuard],
  exports: [AuthClientService, CentralizedAuthGuard],
})
export class AuthModule {}
