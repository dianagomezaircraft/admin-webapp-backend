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
      code?: string;
      logo?: string;
      branding?: any;
      active?: boolean;
    }
  ) {
    // Verify airline exists
    await this.getById(id);

    // If code is being updated, check it doesn't conflict with another airline
    if (data.code) {
      const existing = await prisma.airline.findUnique({
        where: { code: data.code },
      });

      if (existing && existing.id !== id) {
        throw new Error('Airline code already exists');
      }
    }

    // Build update data object, only including fields that are provided
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.active !== undefined) updateData.active = data.active;
    
    // Handle branding specially - only update if provided
    if (data.branding !== undefined) {
      updateData.branding = data.branding;
    }

    return prisma.airline.update({
      where: { id },
      data: updateData,
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