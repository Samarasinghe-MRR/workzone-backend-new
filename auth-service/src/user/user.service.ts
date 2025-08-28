import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
//import bcrypt from 'bcrypt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Create a new user with hashed password (Auth Service - minimal data)
   */
  async createUser(userData: {
    email: string;
    password: string;
    phone: string;
    role?: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN';
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 10); // hash password
    return this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: userData.role || 'CUSTOMER',
      },
    });
  }

  /**
   * Find a user by id
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Update user details (e.g. password)
   */
  async updateUser(id: string, data: { password?: string }) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10); // hash new password
    }
    return this.prisma.user.update({ where: { id }, data });
  }

  // async findBySocialId(socialId: string) {
  //   return this.prisma.user.findFirst({ where: { socialId } });
  // }

  // async createSocialUser(data: {
  //   email: string;
  //   name: string;
  //   socialId: string;
  // }) {
  //   return this.prisma.user.create({
  //     data: {
  //       email: data.email,
  //       socialId: data.socialId,
  //       status: 'ACTIVE',
  //     },
  //   });
  // }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async createGoogleUser(data: { googleId: string; email: string }) {
    return this.prisma.user.create({
      data: {
        googleId: data.googleId,
        email: data.email,
        status: 'ACTIVE',
        role: 'CUSTOMER',
      },
    });
  }
}
