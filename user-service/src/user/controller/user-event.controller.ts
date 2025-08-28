import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { UserService } from '../service/user.service';
import {
  UserCreatedEvent,
  UserVerifiedEvent,
  PasswordChangedEvent,
  USER_EVENTS,
} from '../../events/user.events';

@Controller()
export class UserEventController {
  private readonly logger = new Logger(UserEventController.name);

  constructor(private readonly userService: UserService) {}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @EventPattern(USER_EVENTS.USER_CREATED)
  async handleUserCreated(data: UserCreatedEvent) {
    this.logger.log(`Handling UserCreated event for user: ${data.authUserId}`);
    try {
      await this.userService.createUserProfileFromEvent(data);
      this.logger.log(`✅ User profile created for user: ${data.authUserId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to create user profile: ${(error as Error).message}`,
      );
    }
  }

  @EventPattern(USER_EVENTS.USER_VERIFIED)
  async handleUserVerified(data: UserVerifiedEvent) {
    this.logger.log(`Handling UserVerified event for user: ${data.authUserId}`);
    try {
      await this.userService.updateVerificationStatus(
        data.email, // Using email instead of authUserId since schema doesn't have authUserId
        !!data.verifiedAt, // Convert Date to boolean: true if verifiedAt exists
      );
      this.logger.log(
        `✅ User verification status updated for user: ${data.authUserId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update verification status: ${(error as Error).message}`,
      );
    }
  }

  @EventPattern(USER_EVENTS.PASSWORD_CHANGED)
  handlePasswordChanged(data: PasswordChangedEvent) {
    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `Handling PasswordChanged event for user: ${data.authUserId}`,
    );
    // Here we could update any password-related metadata in User Service
    // For now, just log the event since passwords are managed by Auth Service
    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `✅ Password change event acknowledged for user: ${data.authUserId}`,
    );
  }
}
