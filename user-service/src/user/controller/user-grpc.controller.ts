/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../service/user.service';

interface FindUserRequest {
  id?: string;
  email?: string;
}

interface FindUserResponse {
  user?: {
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
  };
  success: boolean;
  message?: string;
}

@Controller()
export class UserGrpcController {
  private readonly logger = new Logger(UserGrpcController.name);

  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'FindUser')
  async findUser(data: FindUserRequest): Promise<FindUserResponse> {
    try {
      this.logger.log(`gRPC FindUser request: ${JSON.stringify(data)}`);

      let user;
      if (data.id) {
        user = await this.userService.findUserById(data.id);
      } else if (data.email) {
        user = await this.userService.findUserByEmail(data.email);
      } else {
        return {
          success: false,
          message: 'Either id or email must be provided',
        };
      }

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          isActive: user.isActive,
          role: {
            id: user.role.id,
            name: user.role.name,
          },
        },
      };
    } catch (error) {
      this.logger.error(`gRPC FindUser error: ${(error as Error).message}`);
      return {
        success: false,
        message: `Internal server error: ${(error as Error).message}`,
      };
    }
  }

  @GrpcMethod('UserService', 'HealthCheck')
  // eslint-disable-next-line @typescript-eslint/require-await
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
