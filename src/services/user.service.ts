import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/password';
import { Role } from '@prisma/client';

export class UserService {
  async getAll(airlineId?: string, includeInactive = false) {
    return prisma.user.findMany({
      where: {
        ...(airlineId && { airlineId }),
        ...(includeInactive ? {} : { active: true }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        airlineId: true,
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        airlineId: true,
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
            logo: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    airlineId?: string | null;
  }) {
    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('Email already exists');
    }

    // Validate role and airlineId
    if (data.role !== Role.SUPER_ADMIN && !data.airlineId) {
      throw new Error('Airline is required for non-SUPER_ADMIN users');
    }

    if (data.role === Role.SUPER_ADMIN && data.airlineId) {
      throw new Error('SUPER_ADMIN cannot be associated with an airline');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        airlineId: data.airlineId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        airlineId: true,
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: Role;
      airlineId?: string | null;
      active?: boolean;
    }
  ) {
    const user = await this.getById(id);

    // Validate role and airlineId changes
    if (data.role === Role.SUPER_ADMIN && (data.airlineId || user.airlineId)) {
      throw new Error('SUPER_ADMIN cannot be associated with an airline');
    }

    if (data.role && data.role !== Role.SUPER_ADMIN && !data.airlineId && !user.airlineId) {
      throw new Error('Airline is required for non-SUPER_ADMIN users');
    }

    return prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        airlineId: data.airlineId,
        active: data.active,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        airlineId: true,
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async deactivate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  async activate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { active: true },
    });
  }

  async changePassword(id: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Delete all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });
  }
}