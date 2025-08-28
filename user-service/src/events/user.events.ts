import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserService } from '../user/service/user.service';
import { USER_EVENTS } from './rabbitmq.config';
import {
  UserCreatedEvent,
  UserVerifiedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  PasswordChangedEvent,
} from './user-events.interface';

@Controller()
export class UserEventController {
  private readonly logger = new Logger(UserEventController.name);

  constructor(private readonly userService: UserService) {}

  @EventPattern(USER_EVENTS.USER_CREATED)
  async handleUserCreated(@Payload() data: UserCreatedEvent) {
    this.logger.log(`Processing user.created event for: ${data.email}`);

    try {
      // First, find or create the role
      let role = await this.userService.findRoleByName(data.role);
      if (!role) {
        role = await this.userService.createRole(data.role);
        this.logger.log(`Created new role: ${data.role}`);
      }

      // Create user profile in User Service
      const userProfile = await this.userService.createUserProfile({
        authUserId: data.id, // Link to Auth Service User.id
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        isVerified: data.isVerified,
        roleId: role.id,
      });

      this.logger.log(
        `Created user profile for: ${data.email} with ID: ${userProfile.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process user.created event for ${data.email}:`,
        error,
      );
    }
  }

  @EventPattern(USER_EVENTS.USER_VERIFIED)
  async handleUserVerified(@Payload() data: UserVerifiedEvent) {
    this.logger.log(`Processing user.verified event for: ${data.email}`);

    try {
      // Update user verification status
      await this.userService.updateUserByAuthId(data.id, {
        isVerified: true,
      });

      this.logger.log(`Updated verification status for user: ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.verified event for ${data.email}:`,
        error,
      );
    }
  }

  @EventPattern(USER_EVENTS.USER_UPDATED)
  async handleUserUpdated(@Payload() data: UserUpdatedEvent) {
    this.logger.log(`Processing user.updated event for: ${data.email}`);

    try {
      // Update user profile
      await this.userService.updateUserByAuthId(data.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      this.logger.log(`Updated user profile for: ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.updated event for ${data.email}:`,
        error,
      );
    }
  }

  @EventPattern(USER_EVENTS.USER_DELETED)
  async handleUserDeleted(@Payload() data: UserDeletedEvent) {
    this.logger.log(`Processing user.deleted event for: ${data.email}`);

    try {
      // Soft delete or mark as inactive
      await this.userService.updateUserByAuthId(data.id, {
        isActive: false,
      });

      this.logger.log(`Deactivated user profile for: ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.deleted event for ${data.email}:`,
        error,
      );
    }
  }

  @EventPattern(USER_EVENTS.PASSWORD_CHANGED)
  async handlePasswordChanged(@Payload() data: PasswordChangedEvent) {
    this.logger.log(`Handling PasswordChanged event for user: ${data.id}`);

    try {
      await this.userService.updateUserByAuthId(data.id, {
        passwordLastChanged: data.changedAt,
      });
      this.logger.log(
        `✅ Password change event acknowledged for user: ${data.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process password.changed event for ${data.email}:`,
        error,
      );
    }
  }
}
export {
  UserCreatedEvent,
  UserVerifiedEvent,
  USER_EVENTS,
  PasswordChangedEvent,
};
