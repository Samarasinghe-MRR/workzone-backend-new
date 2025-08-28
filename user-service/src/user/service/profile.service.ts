import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomerProfile(userId: string, dto: { address: string }) {
    const exists = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (exists) throw new ConflictException('Customer profile already exists');
    return this.prisma.customerProfile.create({
      data: { userId, address: dto.address },
    });
  }

  async createServiceProviderProfile(
    userId: string,
    dto: {
      category: string;
      location: string;
      experienceYears: number;
      latitude: number;
      longitude: number;
    },
  ) {
    const exists = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (exists)
      throw new ConflictException('Service provider profile already exists');
    return this.prisma.serviceProviderProfile.create({
      data: {
        userId,
        category: dto.category,
        location: dto.location,
        experienceYears: dto.experienceYears,
        latitude: dto.latitude,
        longitude: dto.longitude,
        availability: true,
      },
    });
  }

  async createAdminProfile(userId: string) {
    const exists = await this.prisma.adminProfile.findUnique({
      where: { userId },
    });
    if (exists) throw new ConflictException('Admin profile already exists');
    return this.prisma.adminProfile.create({ data: { userId } });
  }

  // Update methods for existing profiles
  async updateCustomerProfile(userId: string, dto: { address: string }) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new Error('Customer profile not found');
    }
    return this.prisma.customerProfile.update({
      where: { userId },
      data: { address: dto.address },
    });
  }

  async updateServiceProviderProfile(
    userId: string,
    dto: {
      category?: string;
      location?: string;
      experienceYears?: number;
      latitude?: number;
      longitude?: number;
      availability?: boolean;
    },
  ) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new Error('Service provider profile not found');
    }

    const updateData: {
      category?: string;
      location?: string;
      experienceYears?: number;
      latitude?: number;
      longitude?: number;
      availability?: boolean;
    } = {};
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.experienceYears !== undefined) {
      updateData.experienceYears = dto.experienceYears;
    }
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.availability !== undefined) {
      updateData.availability = dto.availability;
    }

    return this.prisma.serviceProviderProfile.update({
      where: { userId },
      data: updateData,
    });
  }
}
