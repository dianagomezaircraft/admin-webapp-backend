import { prisma } from '../lib/prisma';
import { ContentType } from '@prisma/client';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  role: Role;  // Cambiado de string a Role
  airlineId: string | null;  // Cambiado de string a string | null
}

interface CreateContentDto {
  title: string;
  content: string;
  type: ContentType;
  sectionId: string;
  order?: number;
  metadata?: any;
  active?: boolean;
}

interface UpdateContentDto {
  title?: string;
  content?: string;
  type?: ContentType;
  order?: number;
  metadata?: any;
  active?: boolean;
}

export class ContentService {
  async getAll(sectionId: string, user: User, includeInactive: boolean = false) {
    // First verify the section exists and user has access
    const section = await prisma.manualSection.findUnique({
      where: { id: sectionId },
      include: {
        chapter: true,
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

    const whereClause: any = {
      sectionId,
    };

    if (!includeInactive) {
      whereClause.active = true;
    }

    const content = await prisma.manualContent.findMany({
      where: whereClause,
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                airlineId: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return content;
  }

  async getById(id: string, user: User) {
    const content = await prisma.manualContent.findUnique({
      where: { id },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                airlineId: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      const error: any = new Error('Content not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && content.section.chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this content');
      error.statusCode = 403;
      throw error;
    }

    return content;
  }

  async create(data: CreateContentDto, user: User) {
    const { title, content, type, sectionId, order, metadata, active } = data;

    // Validation
    if (!title || !title.trim()) {
      const error: any = new Error('Title is required');
      error.statusCode = 400;
      throw error;
    }

    if (!content || !content.trim()) {
      const error: any = new Error('Content is required');
      error.statusCode = 400;
      throw error;
    }

    if (!type) {
      const error: any = new Error('Type is required');
      error.statusCode = 400;
      throw error;
    }

    if (!sectionId) {
      const error: any = new Error('sectionId is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate content type
    const validContentTypes: ContentType[] = ['TEXT', 'IMAGE', 'VIDEO', 'PDF'];
    if (!validContentTypes.includes(type)) {
      const error: any = new Error(
        `Invalid type. Must be one of: ${validContentTypes.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Verify section exists and user has access
    const section = await prisma.manualSection.findUnique({
      where: { id: sectionId },
      include: {
        chapter: true,
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

    // If order not provided, get the next order number
    let contentOrder = order;
    if (contentOrder === undefined || contentOrder === null) {
      const lastContent = await prisma.manualContent.findFirst({
        where: { sectionId },
        orderBy: { order: 'desc' },
      });
      contentOrder = lastContent ? lastContent.order + 1 : 1;
    }

    const newContent = await prisma.manualContent.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type: type,
        sectionId,
        order: contentOrder,
        metadata: metadata || {},
        active: active !== undefined ? active : true,
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                airlineId: true,
              },
            },
          },
        },
      },
    });

    return newContent;
  }

  async update(id: string, data: UpdateContentDto, user: User) {
    const { title, content, type, order, metadata, active } = data;

    // Check if content exists
    const existingContent = await prisma.manualContent.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            chapter: true,
          },
        },
      },
    });

    if (!existingContent) {
      const error: any = new Error('Content not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && existingContent.section.chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this content');
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

    if (content !== undefined) {
      if (!content.trim()) {
        const error: any = new Error('Content cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      updateData.content = content.trim();
    }

    if (type !== undefined) {
      const validContentTypes: ContentType[] = ['TEXT', 'IMAGE', 'VIDEO', 'PDF'];
      if (!validContentTypes.includes(type)) {
        const error: any = new Error(
          `Invalid type. Must be one of: ${validContentTypes.join(', ')}`
        );
        error.statusCode = 400;
        throw error;
      }
      updateData.type = type;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    updateData.updatedAt = new Date();

    const updatedContent = await prisma.manualContent.update({
      where: { id },
      data: updateData,
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                airlineId: true,
              },
            },
          },
        },
      },
    });

    return updatedContent;
  }

  async delete(id: string, user: User) {
    // Check if content exists
    const existingContent = await prisma.manualContent.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            chapter: true,
          },
        },
      },
    });

    if (!existingContent) {
      const error: any = new Error('Content not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify tenant isolation
    if (user.role !== 'SUPER_ADMIN' && existingContent.section.chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this content');
      error.statusCode = 403;
      throw error;
    }

    await prisma.manualContent.delete({
      where: { id },
    });

    return true;
  }

  async search(query: string, user: User, chapterId?: string) {
    // Build where clause
    const whereClause: any = {
      active: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
      section: {
        active: true,
        chapter: {
          active: true,
        },
      },
    };

    // Filter by airline for non-super admins
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.section.chapter.airlineId = user.airlineId;
    }

    // Filter by chapter if provided
    if (chapterId) {
      whereClause.section.chapterId = chapterId;
    }

    const results = await prisma.manualContent.findMany({
      where: whereClause,
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                airlineId: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50, // Limit results
    });

    return results;
  }
}