import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";

import { ProxyController } from "./proxy.controller";
import { ProxyService } from "./proxy.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
