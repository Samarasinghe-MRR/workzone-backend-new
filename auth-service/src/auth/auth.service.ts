/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    role: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN' = 'CUSTOMER',
  ) {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Create the user in Auth Service (minimal data for authentication)
    const user = await this.userService.createUser({
      email,
      password,
      phone,
      role,
    });

    // 🔐 Generate email verification token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // 📧 Send email (log for now)
    console.log(
      `✅ Verification Link: http://localhost:3000/auth/verify?token=${token}`,
    );

    // 🚀 Publish user.created event to RabbitMQ for User Service
    this.eventPublisher.publishUserCreated({
      id: user.id,
      email: user.email || '',
      firstName,
      lastName,
      phone: user.phone || '',
      role: role.toLowerCase(),
      isVerified: false,
      createdAt: user.createdAt,
    });

    return { id: user.id, email: user.email };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    if (!user.password) return null;
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    return user;
  }

  login(user: { id: string; role: string }) {
    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id,
      role: user.role,
    };
  }

  async verifyEmail(token: string) {
    const found = await this.prisma.verificationToken.findFirst({
      where: { token },
      include: { user: true },
    });

    if (!found || found.type !== 'EMAIL_VERIFICATION') {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    if (found.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: found.userId },
      data: {
        status: 'ACTIVE',
      },
    });

    await this.prisma.verificationToken.delete({
      where: { id: found.id },
    });

    // 🚀 Publish user.verified event to RabbitMQ
    this.eventPublisher.publishUserVerified({
      id: updatedUser.id,
      email: updatedUser.email || '',
      verifiedAt: new Date(),
    });

    return {
      message: '🎉 Email successfully verified. You can now log in.',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // For now just log the link
    console.log(
      `🔗 Reset your password: http://localhost:3000/auth/reset-password?token=${token}`,
    );

    return { message: 'Password reset link sent (logged to console)' };
  }

  async resetPassword(token: string, newPassword: string) {
    const found = await this.prisma.verificationToken.findFirst({
      where: { token },
    });

    if (
      !found ||
      found.type !== 'PASSWORD_RESET' ||
      found.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: found.userId },
      data: { password: hashed },
    });

    await this.prisma.verificationToken.delete({
      where: { id: found.id },
    });

    return { message: '✅ Password successfully updated. You can now log in.' };
  }

  // async socialLogin(profile: {
  //   socialId: string;
  //   email: string;
  //   name: string;
  // }) {
  //   const existing = await this.userService.findBySocialId(profile.socialId);

  //   let user = existing;
  //   if (!existing) {
  //     user = await this.userService.createSocialUser(profile);
  //   }

  //   return this.login({ id: user.id, role: user.role });
  // }

  async validateOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
  }) {
    let user = await this.userService.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.userService.createGoogleUser(googleUser);
    }

    return user;
  }
}
