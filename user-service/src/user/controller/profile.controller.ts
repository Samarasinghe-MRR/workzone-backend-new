import { Controller, Post, Param, Body } from '@nestjs/common';
import { ProfileService } from '../service/profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('customers/:id')
  createCustomerProfile(
    @Param('id') userId: string,
    @Body() dto: { address: string },
  ) {
    return this.profileService.createCustomerProfile(userId, dto);
  }

  @Post('service-providers/:id')
  createServiceProviderProfile(
    @Param('id') userId: string,
    @Body()
    dto: {
      category: string;
      location: string;
      experienceYears: number;
      latitude: number;
      longitude: number;
    },
  ) {
    return this.profileService.createServiceProviderProfile(userId, dto);
  }

  @Post('admins/:id')
  createAdminProfile(@Param('id') userId: string) {
    return this.profileService.createAdminProfile(userId);
  }
}
