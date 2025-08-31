import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "WorkZone Quotation Service is running! 🎯";
  }
}
