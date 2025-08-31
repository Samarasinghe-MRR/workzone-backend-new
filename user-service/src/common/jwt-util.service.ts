/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string; // user ID
  role: string; // user role
  iat?: number; // issued at
  exp?: number; // expires at
}

@Injectable()
export class JwtUtilService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Decode JWT token and extract user information
   * @param token JWT token string (without 'Bearer ' prefix)
   * @returns Decoded payload with user ID and role
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      // Verify and decode the token
      const payload = this.jwtService.verify(token);
      return payload as JwtPayload;
    } catch (error) {
      console.error(
        'Invalid JWT token:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Extract user ID from JWT token
   * @param token JWT token string
   * @returns User ID or null if invalid
   */
  getUserIdFromToken(token: string): string | null {
    const payload = this.decodeToken(token);
    return payload?.sub || null;
  }

  /**
   * Extract user role from JWT token
   * @param token JWT token string
   * @returns User role or null if invalid
   */
  getUserRoleFromToken(token: string): string | null {
    const payload = this.decodeToken(token);
    return payload?.role || null;
  }

  /**
   * Check if token is valid and not expired
   * @param token JWT token string
   * @returns boolean indicating if token is valid
   */
  isTokenValid(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return false;

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  }

  /**
   * Validate token and return user information
   * @param token JWT token string
   * @returns User information or null if invalid
   */
  validateTokenAndGetUser(
    token: string,
  ): { userId: string; role: string } | null {
    if (!token) return null;

    const payload = this.decodeToken(token);
    if (!payload || !payload.sub || !payload.role) return null;

    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
