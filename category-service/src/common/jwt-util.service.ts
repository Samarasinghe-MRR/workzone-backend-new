import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtUtilService {
  private readonly secretKey = process.env.JWT_SECRET || "workzone-secret-key";

  validateTokenAndGetUser(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
      return decoded;
    } catch (error) {
      console.error("JWT Validation Error:", error.message);
      return null;
    }
  }

  validateAdminToken(token: string): TokenPayload {
    const userInfo = this.validateTokenAndGetUser(token);

    if (!userInfo) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (userInfo.role?.toUpperCase() !== "ADMIN") {
      throw new UnauthorizedException("Admin access required");
    }

    return userInfo;
  }
}
