import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "WorkZone Job Service is running! 🚀";
  }
}
