import { prisma } from '../lib/prisma';
import { ContentType } from '@prisma/client';

export class ManualService {
  // ============================================
  // CHAPTERS
  // ============================================

  async getAllChapters(airlineId: string, includeInactive = false) {
    return prisma.manualChapter.findMany({
      where: {
        airlineId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        _count: {
          select: { sections: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async getChapterById(id: string, airlineId: string) {
    const chapter = await prisma.manualChapter.findFirst({
      where: { id, airlineId },
      include: {
        sections: {
          where: { active: true },
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { contents: true },
            },
          },
        },
      },
    });

    if (!chapter) {
      throw new Error('Chapter not found');
    }

    return chapter;
  }

  async createChapter(airlineId: string, data: {
    title: string;
    description?: string;
    order: number;
  }) {
    return prisma.manualChapter.create({
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        airlineId,
      },
    });
  }

  async updateChapter(id: string, airlineId: string, data: {
    title?: string;
    description?: string;
    order?: number;
    active?: boolean;
  }) {
    await this.getChapterById(id, airlineId);

    return prisma.manualChapter.update({
      where: { id },
      data,
    });
  }

  async deleteChapter(id: string, airlineId: string) {
    await this.getChapterById(id, airlineId);

    return prisma.manualChapter.delete({
      where: { id },
    });
  }

  // ============================================
  // SECTIONS
  // ============================================

  async getAllSections(chapterId: string, airlineId: string, includeInactive = false) {
    // Verify chapter belongs to airline
    const chapter = await this.getChapterById(chapterId, airlineId);

    return prisma.manualSection.findMany({
      where: {
        chapterId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        _count: {
          select: { contents: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async getSectionById(id: string, airlineId: string) {
    const section = await prisma.manualSection.findFirst({
      where: {
        id,
        chapter: { airlineId },
      },
      include: {
        chapter: true,
        contents: {
          where: { active: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    return section;
  }

  async createSection(chapterId: string, airlineId: string, data: {
    title: string;
    description?: string;
    order: number;
  }) {
    // Verify chapter belongs to airline
    await this.getChapterById(chapterId, airlineId);

    return prisma.manualSection.create({
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        chapterId,
      },
    });
  }

  async updateSection(id: string, airlineId: string, data: {
    title?: string;
    description?: string;
    order?: number;
    active?: boolean;
  }) {
    await this.getSectionById(id, airlineId);

    return prisma.manualSection.update({
      where: { id },
      data,
    });
  }

  async deleteSection(id: string, airlineId: string) {
    await this.getSectionById(id, airlineId);

    return prisma.manualSection.delete({
      where: { id },
    });
  }

  // ============================================
  // CONTENTS
  // ============================================

  async getAllContents(sectionId: string, airlineId: string, includeInactive = false) {
    // Verify section belongs to airline
    await this.getSectionById(sectionId, airlineId);

    return prisma.manualContent.findMany({
      where: {
        sectionId,
        ...(includeInactive ? {} : { active: true }),
      },
      orderBy: { order: 'asc' },
    });
  }

  async getContentById(id: string, airlineId: string) {
    const content = await prisma.manualContent.findFirst({
      where: {
        id,
        section: {
          chapter: { airlineId },
        },
      },
      include: {
        section: {
          include: {
            chapter: true,
          },
        },
      },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    return content;
  }

  async createContent(sectionId: string, airlineId: string, data: {
    title: string;
    type: ContentType;
    content: string;
    order: number;
    metadata?: any;
  }) {
    // Verify section belongs to airline
    await this.getSectionById(sectionId, airlineId);

    return prisma.manualContent.create({
      data: {
        title: data.title,
        type: data.type,
        content: data.content,
        order: data.order,
        metadata: data.metadata,
        sectionId,
      },
    });
  }

  async updateContent(id: string, airlineId: string, data: {
    title?: string;
    type?: ContentType;
    content?: string;
    order?: number;
    metadata?: any;
    active?: boolean;
  }) {
    await this.getContentById(id, airlineId);

    return prisma.manualContent.update({
      where: { id },
      data,
    });
  }

  async deleteContent(id: string, airlineId: string) {
    await this.getContentById(id, airlineId);

    return prisma.manualContent.delete({
      where: { id },
    });
  }
}