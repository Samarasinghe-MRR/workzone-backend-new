import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: "Category Service",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }
}
