/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class UserService {}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
//import { UpdateUserDto } from '../dto/update-user.dto';
//import { User } from '../../generated/prisma'; // Adjust path as needed
import { User } from '../../../generated/prisma';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';
import { RoleService } from './role.service';
import { ProfileService } from './profile.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly profileService: ProfileService,
  ) {}

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        serviceProviderProfile: true,
        customerProfile: true,
        adminProfile: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  async updateUser(id: string, data: Partial<CreateUserDto>) {
    // Build update data, excluding password since it's managed by auth service
    const updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: { connect: { id: string } };
    } = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;

    // Handle role relationship properly
    if (
      'roleId' in data &&
      (data as any).roleId !== undefined &&
      (data as any).roleId !== null
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updateData.role = { connect: { id: (data as any).roleId } };
    } else if ('role' in data && (data as any).role !== undefined) {
      // If using UserRole enum, find the role by name
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const roleName = (data as any).role;
      const role = await this.prisma.role.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: { name: roleName },
      });
      if (role) {
        updateData.role = { connect: { id: role.id } };
      }
    }

    // Note: password is managed by auth service, so we skip it

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });
  }

  async createUser(data: CreateUserDto) {
    // Handle role connection based on DTO structure
    let roleConnection: { connect: { id: string } };

    if ('roleId' in data && (data as any).roleId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      roleConnection = { connect: { id: (data as any).roleId } };
    } else if ('role' in data && (data as any).role) {
      // If using UserRole enum, find the role by name
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const roleName = (data as any).role;
      const role = await this.prisma.role.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: { name: roleName },
      });
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }
      roleConnection = { connect: { id: role.id } };
    } else {
      throw new Error('Either roleId or role must be provided');
    }

    return this.prisma.user.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        authUserId: data.authUserId, // Ensure this property exists in CreateUserDto
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: roleConnection,
      },
      include: {
        role: true,
      },
    });
  }

  async softDeleteUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async listActiveUsers() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
      },
    });
  }

  // Event-driven methods for RabbitMQ integration
  async createUserProfileFromEvent(data: {
    authUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    provider?: string;
  }) {
    // Check if user already exists by email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error(`User with email ${data.email} already exists`);
    }

    // Note: Current schema doesn't have password field - it might be handled differently
    return this.prisma.user.create({
      data: {
        authUserId: data.authUserId,
        email: data.email,
        firstName: data.firstName || 'Unknown',
        lastName: data.lastName || 'User',
        phone: `temp-${Date.now()}`, // Temporary phone until user updates
        roleId: data.roleId || 'default-customer-role-id',
        isActive: true,
        isVerified: false,
      },
      include: {
        role: true,
      },
    });
  }

  async updateVerificationStatus(email: string, isVerified: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified },
    });
  }

  // Event-driven methods for RabbitMQ

  // Additional methods that might be called by controllers
  async createUserProfile(userData: CreateUserProfileDto) {
    // Create user profile from external service call
    return this.prisma.user.create({
      data: {
        authUserId: userData.authUserId, // Required field linking to Auth Service
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        roleId: userData.roleId,
        isActive: true,
        isVerified: userData.isVerified || false,
      },
      include: {
        role: true,
      },
    });
  }

  // Delegate role methods to RoleService
  async createRole(name: string) {
    return this.roleService.createRole(name);
  }

  async findRoleByName(name: string) {
    return this.roleService.findRoleByName(name);
  }

  async assignRole(userId: string, roleName: string) {
    // First find the role by name to get roleId
    const role = await this.roleService.findRoleByName(roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }
    return this.roleService.assignRole(userId, role.id);
  }

  // Event-driven methods for RabbitMQ
  async updateUserByAuthId(
    authUserId: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      isVerified: boolean;
      isActive: boolean;
      passwordLastChanged: Date; // ✅ add this
    }>,
  ) {
    return this.prisma.user.update({
      where: { authUserId },
      data,
      include: {
        role: true,
      },
    });
  }

  async findUserByAuthId(authUserId: string) {
    return this.prisma.user.findUnique({
      where: { authUserId },
      include: {
        role: true,
        serviceProviderProfile: true,
        customerProfile: true,
        adminProfile: true,
      },
    });
  }

  // Delegate profile methods to ProfileService
  async updateCustomerProfile(
    userId: string,
    profileData: { address: string },
  ) {
    return this.profileService.updateCustomerProfile(userId, profileData);
  }

  async updateServiceProviderProfile(
    userId: string,
    profileData: {
      category?: string;
      location?: string;
      experienceYears?: number;
      latitude?: number;
      longitude?: number;
      availability?: boolean;
    },
  ) {
    return this.profileService.updateServiceProviderProfile(
      userId,
      profileData,
    );
  }
}

// Export the DTO for compatibility
export { CreateUserProfileDto };
