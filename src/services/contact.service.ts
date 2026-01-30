// services/contact.service.ts
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  role: Role;
  airlineId: string | null;
}

// Contact Group DTOs
interface CreateContactGroupDto {
  name: string;
  description?: string;
  order?: number;
  active?: boolean;
  airlineId?: string; // AGREGADO: Permitir pasar airlineId explícitamente para SUPER_ADMIN
}

interface UpdateContactGroupDto {
  name?: string;
  description?: string;
  order?: number;
  active?: boolean;
}

// Contact DTOs
interface CreateContactDto {
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  avatar?: string;
  groupId: string;
  order?: number;
  metadata?: any;
  active?: boolean;
}

interface UpdateContactDto {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  avatar?: string;
  order?: number;
  metadata?: any;
  active?: boolean;
}

export class ContactService {
  // ============================================
  // CONTACT GROUPS
  // ============================================
  
  async getAllGroups(user: User, includeInactive: boolean = false) {
    const whereClause: any = {};

    // Tenant isolation
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.airlineId = user.airlineId;
    }

    if (!includeInactive) {
      whereClause.active = true;
    }

    const groups = await prisma.contactGroup.findMany({
      where: whereClause,
      include: {
        contacts: {
          where: includeInactive ? {} : { active: true },
          orderBy: { order: 'asc' },
        },
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return groups;
  }

  async getGroupById(id: string, user: User) {
    const group = await prisma.contactGroup.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: { order: 'asc' },
        },
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!group) {
      const error: any = new Error('Contact group not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && group.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact group');
      error.statusCode = 403;
      throw error;
    }

    return group;
  }

  async createGroup(data: CreateContactGroupDto, user: User) {
    const { name, description, order, active, airlineId } = data;

    if (!name || !name.trim()) {
      const error: any = new Error('Name is required');
      error.statusCode = 400;
      throw error;
    }

    // CAMBIO PRINCIPAL: Determinar el airlineId correcto
    let targetAirlineId: string;
    
    if (user.role === 'SUPER_ADMIN') {
      // Si es SUPER_ADMIN, debe proporcionar airlineId explícitamente
      if (!airlineId) {
        const error: any = new Error('Airline ID is required for super admin');
        error.statusCode = 400;
        throw error;
      }
      targetAirlineId = airlineId;
    } else {
      // Si no es SUPER_ADMIN, usar su airlineId
      if (!user.airlineId) {
        const error: any = new Error('User must have an airline assigned');
        error.statusCode = 400;
        throw error;
      }
      targetAirlineId = user.airlineId;
    }

    // Get next order if not provided
    let groupOrder = order;
    if (groupOrder === undefined || groupOrder === null) {
      const lastGroup = await prisma.contactGroup.findFirst({
        where: { airlineId: targetAirlineId },
        orderBy: { order: 'desc' },
      });
      groupOrder = lastGroup ? lastGroup.order + 1 : 1;
    }

    const group = await prisma.contactGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        order: groupOrder,
        active: active !== undefined ? active : true,
        airlineId: targetAirlineId, // Usar el airlineId determinado
      },
      include: {
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return group;
  }

  async updateGroup(id: string, data: UpdateContactGroupDto, user: User) {
    const existingGroup = await prisma.contactGroup.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      const error: any = new Error('Contact group not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && existingGroup.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact group');
      error.statusCode = 403;
      throw error;
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        const error: any = new Error('Name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    updateData.updatedAt = new Date();

    const group = await prisma.contactGroup.update({
      where: { id },
      data: updateData,
      include: {
        contacts: {
          orderBy: { order: 'asc' },
        },
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return group;
  }

  async deleteGroup(id: string, user: User) {
    const existingGroup = await prisma.contactGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    if (!existingGroup) {
      const error: any = new Error('Contact group not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && existingGroup.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact group');
      error.statusCode = 403;
      throw error;
    }

    // Check if group has contacts
    if (existingGroup._count.contacts > 0) {
      const error: any = new Error('Cannot delete contact group with existing contacts');
      error.statusCode = 400;
      throw error;
    }

    await prisma.contactGroup.delete({
      where: { id },
    });

    return true;
  }

  // ============================================
  // CONTACTS - ACTUALIZADOS CON AIRLINE_ID
  // ============================================

  async getAllContacts(groupId: string, user: User, includeInactive: boolean = false) {
    // Verify group exists and user has access
    const group = await prisma.contactGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      const error: any = new Error('Contact group not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && group.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact group');
      error.statusCode = 403;
      throw error;
    }

    const whereClause: any = { 
      groupId,
      // Validación adicional por airlineId
      ...(user.role !== 'SUPER_ADMIN' && { airlineId: user.airlineId })
    };

    if (!includeInactive) {
      whereClause.active = true;
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            airlineId: true,
          },
        },
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return contacts;
  }

  async getContactById(id: string, user: User) {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            airlineId: true,
          },
        },
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!contact) {
      const error: any = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }

    // Validación de tenant isolation por airlineId directo
    if (user.role !== 'SUPER_ADMIN' && contact.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact');
      error.statusCode = 403;
      throw error;
    }

    return contact;
  }

  async createContact(data: CreateContactDto, user: User) {
    const { firstName, lastName, groupId, ...otherData } = data;

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

    if (!groupId) {
      const error: any = new Error('Group ID is required');
      error.statusCode = 400;
      throw error;
    }

    // Verify group exists and user has access
    const group = await prisma.contactGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      const error: any = new Error('Contact group not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && group.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact group');
      error.statusCode = 403;
      throw error;
    }

    // CAMBIO: Usar el airlineId del grupo (en lugar del usuario)
    const targetAirlineId = group.airlineId;

    if (!targetAirlineId) {
      const error: any = new Error('Contact group must have an airline assigned');
      error.statusCode = 400;
      throw error;
    }

    // Get next order if not provided
    let contactOrder = otherData.order;
    if (contactOrder === undefined || contactOrder === null) {
      const lastContact = await prisma.contact.findFirst({
        where: { 
          groupId,
          airlineId: targetAirlineId
        },
        orderBy: { order: 'desc' },
      });
      contactOrder = lastContact ? lastContact.order + 1 : 1;
    }

    const contact = await prisma.contact.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: otherData.title?.trim(),
        company: otherData.company?.trim(),
        phone: otherData.phone?.trim(),
        email: otherData.email?.trim(),
        timezone: otherData.timezone?.trim(),
        avatar: otherData.avatar,
        order: contactOrder,
        metadata: otherData.metadata || {},
        active: otherData.active !== undefined ? otherData.active : true,
        groupId,
        airlineId: targetAirlineId,  // Usar airlineId del grupo
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            airlineId: true,
          },
        },
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return contact;
  }

  async updateContact(id: string, data: UpdateContactDto, user: User) {
    const existingContact = await prisma.contact.findUnique({
      where: { id },
      include: {
        group: true,
      },
    });

    if (!existingContact) {
      const error: any = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }

    // Validación de tenant isolation por airlineId directo
    if (user.role !== 'SUPER_ADMIN' && existingContact.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact');
      error.statusCode = 403;
      throw error;
    }

    const updateData: any = {};

    if (data.firstName !== undefined) {
      if (!data.firstName.trim()) {
        const error: any = new Error('First name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      updateData.firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      if (!data.lastName.trim()) {
        const error: any = new Error('Last name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      updateData.lastName = data.lastName.trim();
    }

    if (data.title !== undefined) updateData.title = data.title?.trim() || null;
    if (data.company !== undefined) updateData.company = data.company?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.timezone !== undefined) updateData.timezone = data.timezone?.trim() || null;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.active !== undefined) updateData.active = data.active;

    updateData.updatedAt = new Date();

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            airlineId: true,
          },
        },
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return contact;
  }

  async deleteContact(id: string, user: User) {
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      const error: any = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }

    // Validación de tenant isolation por airlineId directo
    if (user.role !== 'SUPER_ADMIN' && existingContact.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this contact');
      error.statusCode = 403;
      throw error;
    }

    await prisma.contact.delete({
      where: { id },
    });

    return true;
  }
}