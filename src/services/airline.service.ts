import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class AirlineService {
  async getAll(includeInactive = false) {
    return prisma.airline.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        _count: {
          select: { users: true, manualChapters: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const airline = await prisma.airline.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, manualChapters: true },
        },
      },
    });

    if (!airline) {
      throw new Error('Airline not found');
    }

    return airline;
  }

  async create(data: {
    name: string;
    code: string;
    logo?: string;
    branding?: any;
  }) {
    // Check if code already exists
    const existing = await prisma.airline.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Airline code already exists');
    }

    return prisma.airline.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        logo: data.logo,
        branding: data.branding || Prisma.JsonNull,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      logo?: string;
      branding?: any;
      active?: boolean;
    }
  ) {
    const airline = await this.getById(id);

    return prisma.airline.update({
      where: { id },
      data: {
        name: data.name,
        logo: data.logo,
        branding: data.branding !== undefined ? data.branding : undefined,
        active: data.active,
      },
    });
  }

  async delete(id: string) {
    // Check if airline has users
    const userCount = await prisma.user.count({
      where: { airlineId: id },
    });

    if (userCount > 0) {
      throw new Error('Cannot delete airline with existing users');
    }

    return prisma.airline.delete({
      where: { id },
    });
  }

  async deactivate(id: string) {
    return prisma.airline.update({
      where: { id },
      data: { active: false },
    });
  }

  async activate(id: string) {
    return prisma.airline.update({
      where: { id },
      data: { active: true },
    });
  }
}