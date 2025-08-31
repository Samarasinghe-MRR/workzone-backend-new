import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export interface JwtPayload {
  sub: string; // user ID
  role: string; // user role
  iat?: number; // issued at
  exp?: number; // expires at
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validate JWT token and extract user information
   * @param token JWT token string (without 'Bearer ' prefix)
   * @returns Decoded payload with user ID and role
   */
  validateToken(token: string): JwtPayload | null {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      return payload;
    } catch (error) {
      console.error("Invalid JWT token:", error.message);
      return null;
    }
  }

  /**
   * Extract user ID from JWT token
   * @param token JWT token string
   * @returns User ID or null if invalid
   */
  getUserIdFromToken(token: string): string | null {
    const payload = this.validateToken(token);
    return payload?.sub || null;
  }

  /**
   * Extract user role from JWT token
   * @param token JWT token string
   * @returns User role or null if invalid
   */
  getUserRoleFromToken(token: string): string | null {
    const payload = this.validateToken(token);
    return payload?.role || null;
  }

  /**
   * Check if token is valid and not expired
   * @param token JWT token string
   * @returns boolean indicating if token is valid
   */
  isTokenValid(token: string): boolean {
    const payload = this.validateToken(token);
    if (!payload) return false;

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  }

  /**
   * Extract token from Authorization header
   * @param authHeader Authorization header value
   * @returns JWT token string without 'Bearer ' prefix
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }
}
