import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ClientGrpc,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  isActive: boolean;
  role: {
    id: string;
    name: string;
  };
}

interface FindUserRequest {
  id?: string;
  email?: string;
}

interface FindUserResponse {
  user?: UserData;
  success: boolean;
  message?: string;
}

interface UserServiceGrpc {
  findUser(data: FindUserRequest): Promise<FindUserResponse>;
  healthCheck(): Promise<{ status: string; timestamp: string }>;
}

@Injectable()
export class UserGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(UserGrpcClient.name);
  private userService: UserServiceGrpc;
  private client: ClientGrpc;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: join(__dirname, '../../proto/user.proto'),
        url: process.env.USER_SERVICE_GRPC_URL || 'localhost:5001',
      },
    }) as ClientGrpc;
  }

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
    this.logger.log('gRPC client initialized for User Service');
  }

  async getUserProfile(userId: string): Promise<UserData | null> {
    try {
      this.logger.log(`Fetching user profile for ID: ${userId}`);

      const response = await this.userService.findUser({ id: userId });

      if (response.success && response.user) {
        return response.user;
      }

      this.logger.warn(`User profile not found for ID: ${userId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user profile for ID ${userId}:`,
        error,
      );
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      this.logger.log(`Fetching user profile for email: ${email}`);

      const response = await this.userService.findUser({ email });

      if (response.success && response.user) {
        return response.user;
      }

      this.logger.warn(`User profile not found for email: ${email}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user profile for email ${email}:`,
        error,
      );
      return null;
    }
  }

  async checkUserServiceHealth(): Promise<boolean> {
    try {
      const response = await this.userService.healthCheck();
      return response.status === 'healthy';
    } catch (error) {
      this.logger.error('User Service health check failed:', error);
      return false;
    }
  }
}
