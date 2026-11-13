import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, UserStatus, OnboardingStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AuditService } from './AuditService.js';
import { AppError } from '../lib/AppError.js';

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  ip?: string;
  userAgent?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  static async register(dto: RegisterDTO) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password with bcrypt cost factor >= 12 (PRD 6.1)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
          role: Role.ACCOUNT_HOLDER,
          status: UserStatus.ACTIVE,
          onboarding: {
            create: {
              status: OnboardingStatus.DRAFT,
            },
          },
        },
        include: {
          onboarding: true,
        },
      });

      await AuditService.log(
        {
          actorId: newUser.id,
          action: 'USER_REGISTERED',
          resourceType: 'USER',
          resourceId: newUser.id,
          metadata: { email: newUser.email, fullName: newUser.fullName },
          ip: dto.ip,
          userAgent: dto.userAgent,
        },
        tx
      );

      return newUser;
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        onboarding: user.onboarding,
      },
      token,
    };
  }

  static async login(dto: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        onboarding: true,
        accounts: true,
      },
    });

    if (!user) {
      // Record failure audit log if needed
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(`Your account is ${user.status}. Please contact support.`, 403);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    await AuditService.log({
      actorId: user.id,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      metadata: { email: user.email },
      ip: dto.ip,
      userAgent: dto.userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        onboarding: user.onboarding,
        accounts: user.accounts,
      },
      token,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        onboarding: true,
        accounts: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      onboarding: user.onboarding,
      accounts: user.accounts,
    };
  }
}
