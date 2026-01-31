import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class SectionController {
  /**
   * Get all sections for a chapter
   * @route GET /api/chapters/:chapterId/sections (RESTful)
   * @route GET /api/sections?chapterId=xxx (Legacy)
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Obtener chapterId de params (RESTful) o query (legacy)
      const chapterId = req.params.chapterId || (req.query.chapterId as string);
      const { includeInactive } = req.query;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!chapterId) {
        res.status(400).json({ error: 'Chapter ID is required' });
        return;
      }

      // Verify chapter exists and user has access
      const chapter = await prisma.manualChapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      // Verify tenant isolation
      if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this chapter' });
        return;
      }

      // Build where clause
      const whereClause: any = { chapterId };

      if (includeInactive !== 'true') {
        whereClause.active = true;
      }

      const sections = await prisma.manualSection.findMany({
        where: whereClause,
        orderBy: { order: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: sections,
        count: sections.length,
      });
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.status(500).json({
        error: 'Failed to fetch sections',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get section by ID
   * @route GET /api/sections/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const section = await prisma.manualSection.findUnique({
        where: { id },
        include: {
          chapter: {
            include: {
              airline: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });

      if (!section) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }

      // Verify tenant isolation through chapter
      if (user.role !== 'SUPER_ADMIN' && section.chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this section' });
        return;
      }

      res.status(200).json({
        success: true,
        data: section,
      });
    } catch (error) {
      console.error('Error fetching section:', error);
      res.status(500).json({
        error: 'Failed to fetch section',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create new section
   * @route POST /api/chapters/:chapterId/sections (RESTful)
   * @route POST /api/sections (Legacy - chapterId in body)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Obtener chapterId de params (RESTful) o body (legacy)
      const chapterId = req.params.chapterId || req.body.chapterId;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!chapterId) {
        res.status(400).json({ error: 'Chapter ID is required' });
        return;
      }

      const { title, description, order, active, imageUrl } = req.body;

      // Validation
      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      // Verify chapter exists and user has access
      const chapter = await prisma.manualChapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      // Verify tenant isolation
      if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this chapter' });
        return;
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
          description: description?.trim() || null,
          order: sectionOrder,
          active: active !== undefined ? active : true,
          chapterId,
          imageUrl: imageUrl || null,
        },
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: section,
        message: 'Section created successfully',
      });
    } catch (error) {
      console.error('Error creating section:', error);
      res.status(500).json({
        error: 'Failed to create section',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update section
   * @route PUT /api/sections/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title, description, order, active, imageUrl } = req.body;

      // Check if section exists
      const existingSection = await prisma.manualSection.findUnique({
        where: { id },
        include: {
          chapter: true,
        },
      });

      if (!existingSection) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }

      // Verify tenant isolation through chapter
      if (user.role !== 'SUPER_ADMIN' && existingSection.chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this section' });
        return;
      }

      // Build update data
      const updateData: any = {};

      if (title !== undefined) {
        if (!title.trim()) {
          res.status(400).json({ error: 'Title cannot be empty' });
          return;
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }

      if (order !== undefined) {
        updateData.order = order;
      }

      if (active !== undefined) {
        updateData.active = active;
      }

      // Handle imageUrl update
      if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl || null;
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
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: section,
        message: 'Section updated successfully',
      });
    } catch (error) {
      console.error('Error updating section:', error);
      res.status(500).json({
        error: 'Failed to update section',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete section
   * @route DELETE /api/sections/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if section exists
      const existingSection = await prisma.manualSection.findUnique({
        where: { id },
        include: {
          chapter: true,
        },
      });

      if (!existingSection) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }

      // Verify tenant isolation through chapter
      if (user.role !== 'SUPER_ADMIN' && existingSection.chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this section' });
        return;
      }

      // Optional: Delete associated image from storage before deleting section
      // if (existingSection.imageUrl) {
      //   // Call your storage service to delete the image
      //   // await storageService.deleteSectionImage(existingSection.imageUrl);
      // }

      await prisma.manualSection.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Section deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      res.status(500).json({
        error: 'Failed to delete section',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}