import { Injectable, UnauthorizedException } from "@nestjs/common";
import axios from "axios";

export interface UserContext {
  userId: string;
  email: string;
  userType: string;
  role: string;
}

@Injectable()
export class AuthClientService {
  private readonly authServiceUrl =
    process.env.AUTH_SERVICE_URL || "http://localhost:3001";

  async validateToken(token: string): Promise<UserContext> {
    try {
      // Call the centralized Auth Service for token validation
      const response = await axios.post(
        `${this.authServiceUrl}/auth/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000, // 5 second timeout
        }
      );

      return response.data.user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException("Invalid or expired token");
      }

      // Fallback to local JWT validation if Auth Service is down
      console.warn(
        "Auth Service unavailable, falling back to local validation"
      );
      return this.fallbackJWTValidation(token);
    }
  }

  private async fallbackJWTValidation(token: string): Promise<UserContext> {
    // Temporary fallback - in production you might want to fail fast
    // or have a more sophisticated fallback strategy
    const jwt = require("jsonwebtoken");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType,
        role: decoded.role,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
