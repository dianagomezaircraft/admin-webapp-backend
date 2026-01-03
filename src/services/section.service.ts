import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';


interface User {
  id: string;
  email: string;
  role: Role;  // Cambiado de string a Role
  airlineId: string | null;  // Cambiado de string a string | null
}

interface CreateSectionDto {
  title: string;
  description?: string;
  chapterId: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateSectionDto {
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export class SectionService {
  async getAll(chapterId: string, user: User, includeInactive: boolean = false) {
    // First verify the chapter exists and user has access
    const chapter = await prisma.manualChapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      const error: any = new Error('Chapter not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this chapter');
      error.statusCode = 403;
      throw error;
    }

    const whereClause: any = {
      chapterId,
    };

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const sections = await prisma.manualSection.findMany({
      where: whereClause,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            airlineId: true,
          },
        },
        // _count: {
        //   select: {
        //     content: true,
        //   },
        // },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return sections;
  }

  async getById(id: string, user: User) {
    const section = await prisma.manualSection.findUnique({
      where: { id },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            airlineId: true,
          },
        },
        // content: {
        //   where: { isActive: true },
        //   orderBy: { order: 'asc' },
        // },
      },
    });

    if (!section) {
      const error: any = new Error('Section not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && section.chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this section');
      error.statusCode = 403;
      throw error;
    }

    return section;
  }

  async create(data: CreateSectionDto, user: User) {
    const { title, description, chapterId, order, isActive } = data;

    // Validation
    if (!title || !title.trim()) {
      const error: any = new Error('Title is required');
      error.statusCode = 400;
      throw error;
    }

    if (!chapterId) {
      const error: any = new Error('chapterId is required');
      error.statusCode = 400;
      throw error;
    }

    // Verify chapter exists and user has access
    const chapter = await prisma.manualChapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      const error: any = new Error('Chapter not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this chapter');
      error.statusCode = 403;
      throw error;
    }

    // If order not provided, get the next order number
    let sectionOrder = order;
    if (sectionOrder === undefined || sectionOrder === null) {
      const lastSection = await prisma.manualSection.findFirst({
        where: { chapterId },
        orderBy: { order: 'desc' },
      });
      sectionOrder = lastSection ? lastSection.order + 1 : 1;
    }

    const section = await prisma.manualSection.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        chapterId,
        order: sectionOrder,
        active: isActive !== undefined ? isActive : true,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            airlineId: true,
          },
        },
      },
    });

    return section;
  }

  async update(id: string, data: UpdateSectionDto, user: User) {
    const { title, description, order, isActive } = data;

    // Check if section exists
    const existingSection = await prisma.manualSection.findUnique({
      where: { id },
      include: {
        chapter: true,
      },
    });

    if (!existingSection) {
      const error: any = new Error('Section not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && existingSection.chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this section');
      error.statusCode = 403;
      throw error;
    }

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      if (!title.trim()) {
        const error: any = new Error('Title cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    updateData.updatedAt = new Date();

    const section = await prisma.manualSection.update({
      where: { id },
      data: updateData,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            airlineId: true,
          },
        },
        _count: {
          // select: {
          //   content: true,
          // },
        },
      },
    });

    return section;
  }

  async delete(id: string, user: User) {
    // Check if section exists
    const existingSection = await prisma.manualSection.findUnique({
      where: { id },
      include: {
        chapter: true,
        _count: {
          // select: {
          //   content: true,
          // },
        },
      },
    });

    if (!existingSection) {
      const error: any = new Error('Section not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && existingSection.chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this section');
      error.statusCode = 403;
      throw error;
    }

    // Check if section has content
    // if (existingSection._count > 0) {
    //   const error: any = new Error('Cannot delete section with existing content');
    //   error.statusCode = 400;
    //   throw error;
    // }

    await prisma.manualSection.delete({
      where: { id },
    });

    return true;
  }
}