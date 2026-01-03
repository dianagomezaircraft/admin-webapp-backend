import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';


interface User {
  id: string;
  email: string;
  role: Role;  // Cambiado de string a Role
  airlineId: string | null;  // Cambiado de string a string | null
}

interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  airlineId?: string;
  active?: boolean;
}

interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  airlineId?: string;
  active?: boolean;
}

export class UserService {
  async getAll(user: User, airlineId?: string, includeInactive: boolean = false) {
    const whereClause: any = {};

    // SUPER_ADMIN can view all users or filter by airline
    if (user.role === 'SUPER_ADMIN') {
      if (airlineId) {
        whereClause.airlineId = airlineId;
      }
    } else {
      // Other users can only view users from their airline
      whereClause.airlineId = user.airlineId;
    }

    if (!includeInactive) {
      whereClause.active = true;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async getById(id: string, user: User) {
    const foundUser = await prisma.user.findUnique({
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

    if (!foundUser) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify access: SUPER_ADMIN can view all, others only their airline
    if (user.role !== 'SUPER_ADMIN' && foundUser.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this user');
      error.statusCode = 403;
      throw error;
    }

    return foundUser;
  }

  async create(data: CreateUserDto, user: User) {
    const { email, password, firstName, lastName, role, airlineId, active } = data;

    // Validation
    if (!email || !email.trim()) {
      const error: any = new Error('Email is required');
      error.statusCode = 400;
      throw error;
    }

    if (!this.isValidEmail(email)) {
      const error: any = new Error('Invalid email format');
      error.statusCode = 400;
      throw error;
    }

    if (!password || password.length < 8) {
      const error: any = new Error('Password must be at least 8 characters');
      error.statusCode = 400;
      throw error;
    }

    if (!firstName || !firstName.trim()) {
      const error: any = new Error('First name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!lastName || !lastName.trim()) {
      const error: any = new Error('Last name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!role) {
      const error: any = new Error('Role is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'];
    if (!validRoles.includes(role)) {
      const error: any = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      const error: any = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Determine airlineId
    let targetAirlineId: string | null = null;

    if (role === 'SUPER_ADMIN') {
      // SUPER_ADMIN has no airline
      if (airlineId) {
        const error: any = new Error('SUPER_ADMIN cannot be associated with an airline');
        error.statusCode = 400;
        throw error;
      }
      targetAirlineId = null;
    } else {
      // Non-SUPER_ADMIN must have an airline
      if (user.role === 'SUPER_ADMIN' && airlineId) {
        targetAirlineId = airlineId;
      } else {
        targetAirlineId = user.airlineId;
      }

      if (!targetAirlineId) {
        const error: any = new Error('Airline is required for non-SUPER_ADMIN users');
        error.statusCode = 400;
        throw error;
      }

      // Verify airline exists
      const airline = await prisma.airline.findUnique({
        where: { id: targetAirlineId },
      });

      if (!airline) {
        const error: any = new Error('Airline not found');
        error.statusCode = 404;
        throw error;
      }
    }

    // Only SUPER_ADMIN and ADMIN can create users
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const error: any = new Error('Only SUPER_ADMIN and ADMIN can create users');
      error.statusCode = 403;
      throw error;
    }

    // ADMIN can only create users for their own airline
    if (user.role === 'ADMIN' && targetAirlineId !== user.airlineId) {
      const error: any = new Error('ADMIN can only create users for their own airline');
      error.statusCode = 403;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role as Role,
        airlineId: targetAirlineId,
        active: active !== undefined ? active : true,
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
      },
    });

    return newUser;
  }

  async update(id: string, data: UpdateUserDto, user: User) {
    const { email, password, firstName, lastName, role, airlineId, active } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify access
    if (user.role !== 'SUPER_ADMIN' && existingUser.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to update this user');
      error.statusCode = 403;
      throw error;
    }

    // Only SUPER_ADMIN and ADMIN can update users
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const error: any = new Error('Only SUPER_ADMIN and ADMIN can update users');
      error.statusCode = 403;
      throw error;
    }

    // Build update data
    const updateData: any = {};

    if (email !== undefined) {
      if (!email.trim()) {
        const error: any = new Error('Email cannot be empty');
        error.statusCode = 400;
        throw error;
      }

      if (!this.isValidEmail(email)) {
        const error: any = new Error('Invalid email format');
        error.statusCode = 400;
        throw error;
      }

      // Check if new email already exists (excluding current user)
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          id: { not: id },
        },
      });

      if (emailExists) {
        const error: any = new Error('Email already exists');
        error.statusCode = 409;
        throw error;
      }

      updateData.email = email.trim().toLowerCase();
    }

    if (password !== undefined) {
      if (password.length < 8) {
        const error: any = new Error('Password must be at least 8 characters');
        error.statusCode = 400;
        throw error;
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (firstName !== undefined) {
      if (!firstName.trim()) {
        const error: any = new Error('First name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        const error: any = new Error('Last name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      updateData.lastName = lastName.trim();
    }

    if (role !== undefined) {
      // Only SUPER_ADMIN can change roles
      if (user.role !== 'SUPER_ADMIN') {
        const error: any = new Error('Only SUPER_ADMIN can change user roles');
        error.statusCode = 403;
        throw error;
      }

      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'];
      if (!validRoles.includes(role)) {
        const error: any = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }

      // Validate role and airlineId combination
      if (role === 'SUPER_ADMIN' && (airlineId || existingUser.airlineId)) {
        const error: any = new Error('SUPER_ADMIN cannot be associated with an airline');
        error.statusCode = 400;
        throw error;
      }

      if (role !== 'SUPER_ADMIN' && !airlineId && !existingUser.airlineId) {
        const error: any = new Error('Airline is required for non-SUPER_ADMIN users');
        error.statusCode = 400;
        throw error;
      }

      updateData.role = role as Role;

    }

    if (airlineId !== undefined) {
      // Only SUPER_ADMIN can change airline assignments
      if (user.role !== 'SUPER_ADMIN') {
        const error: any = new Error('Only SUPER_ADMIN can change airline assignments');
        error.statusCode = 403;
        throw error;
      }

      if (airlineId) {
        const airline = await prisma.airline.findUnique({
          where: { id: airlineId },
        });

        if (!airline) {
          const error: any = new Error('Airline not found');
          error.statusCode = 404;
          throw error;
        }
      }

      updateData.airlineId = airlineId;
    }

    if (active !== undefined) {
      // Only SUPER_ADMIN and ADMIN can change active status
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        const error: any = new Error('Only SUPER_ADMIN and ADMIN can change user active status');
        error.statusCode = 403;
        throw error;
      }
      updateData.active = active;
    }

    updateData.updatedAt = new Date();

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
      },
    });

    return updatedUser;
  }

  async delete(id: string, user: User) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify access
    if (user.role !== 'SUPER_ADMIN' && existingUser.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to delete this user');
      error.statusCode = 403;
      throw error;
    }

    // Only SUPER_ADMIN and ADMIN can delete users
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const error: any = new Error('Only SUPER_ADMIN and ADMIN can delete users');
      error.statusCode = 403;
      throw error;
    }

    // Users cannot delete themselves
    if (existingUser.id === user.id) {
      const error: any = new Error('You cannot delete your own account');
      error.statusCode = 400;
      throw error;
    }

    // Soft delete by setting active to false
    await prisma.user.update({
      where: { id },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });

    return true;
  }

  async deactivate(id: string, user: User) {
    return this.delete(id, user);
  }

  async activate(id: string, user: User) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify access
    if (user.role !== 'SUPER_ADMIN' && existingUser.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to activate this user');
      error.statusCode = 403;
      throw error;
    }

    // Only SUPER_ADMIN and ADMIN can activate users
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const error: any = new Error('Only SUPER_ADMIN and ADMIN can activate users');
      error.statusCode = 403;
      throw error;
    }

    await prisma.user.update({
      where: { id },
      data: {
        active: true,
        updatedAt: new Date(),
      },
    });

    return true;
  }

  async changePassword(id: string, newPassword: string, user: User) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify access: users can change their own password or SUPER_ADMIN/ADMIN can change others
    if (user.id !== id && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const error: any = new Error('Access denied to change this password');
      error.statusCode = 403;
      throw error;
    }

    if (user.role !== 'SUPER_ADMIN' && existingUser.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to change this password');
      error.statusCode = 403;
      throw error;
    }

    if (newPassword.length < 8) {
      const error: any = new Error('Password must be at least 8 characters');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    return true;
  }

  // Helper method
  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
}