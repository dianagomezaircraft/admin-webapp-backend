import { Request, Response } from 'express';
import {prisma} from '../lib/prisma';


// Extended Request type with user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    airlineId: string;
  };
}

export class ChapterController {
  /**
   * Get all chapters for an airline
   * @route GET /api/chapters
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { airlineId, includeInactive } = req.query;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Determine which airline to query
      let targetAirlineId: string;

      if (user.role === 'SUPER_ADMIN' && airlineId) {
        targetAirlineId = airlineId as string;
      } else {
        targetAirlineId = user.airlineId;
      }

      // Build where clause
      const whereClause: any = {
        airlineId: targetAirlineId,
      };

      // Filter by active status unless includeInactive is true
      if (includeInactive !== 'true') {
        whereClause.active = true;
      }

      const chapters = await prisma.manualChapter.findMany({
        where: whereClause,
        include: {
          airline: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      res.status(200).json({
        success: true,
        data: chapters,
        count: chapters.length,
      });
    } catch (error) {
      console.error('Error fetching chapters:', error);
      res.status(500).json({
        error: 'Failed to fetch chapters',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get chapter by ID
   * @route GET /api/chapters/:id
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const chapter = await prisma.manualChapter.findUnique({
        where: { id },
        include: {
          airline: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          sections: {
            where: { active: true },
            orderBy: { order: 'asc' },
            // include: {
            //   _count: {
            //     select: {
            //       content: true,
            //     },
            //   },
            // },
          },
        },
      });

      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      // Verify tenant isolation (already handled by middleware, but double-check)
      if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this chapter' });
        return;
      }

      res.status(200).json({
        success: true,
        data: chapter,
      });
    } catch (error) {
      console.error('Error fetching chapter:', error);
      res.status(500).json({
        error: 'Failed to fetch chapter',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create new chapter
   * @route POST /api/chapters
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title, description, order, active, airlineId } = req.body;

      // Validation
      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      // Determine airline ID
      let targetAirlineId: string;

      if (user.role === 'SUPER_ADMIN' && airlineId) {
        targetAirlineId = airlineId;
      } else {
        targetAirlineId = user.airlineId;
      }

      // Verify airline exists
      const airline = await prisma.airline.findUnique({
        where: { id: targetAirlineId },
      });

      if (!airline) {
        res.status(404).json({ error: 'Airline not found' });
        return;
      }

      // If order not provided, get the next order number
      let chapterOrder = order;
      if (chapterOrder === undefined || chapterOrder === null) {
        const lastChapter = await prisma.manualChapter.findFirst({
          where: { airlineId: targetAirlineId },
          orderBy: { order: 'desc' },
        });
        chapterOrder = lastChapter ? lastChapter.order + 1 : 1;
      }

      const chapter = await prisma.manualChapter.create({
        data: {
          title: title.trim(),
          description: description?.trim(),
          order: chapterOrder,
          active: active !== undefined ? active : true,
          airlineId: targetAirlineId,
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

      res.status(201).json({
        success: true,
        data: chapter,
        message: 'Chapter created successfully',
      });
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({
        error: 'Failed to create chapter',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update chapter
   * @route PUT /api/chapters/:id
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title, description, order, active } = req.body;

      // Check if chapter exists
      const existingChapter = await prisma.manualChapter.findUnique({
        where: { id },
      });

      if (!existingChapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      // Verify tenant isolation
      if (user.role !== 'SUPER_ADMIN' && existingChapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this chapter' });
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

      updateData.updatedAt = new Date();

      const chapter = await prisma.manualChapter.update({
        where: { id },
        data: updateData,
        include: {
          airline: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: chapter,
        message: 'Chapter updated successfully',
      });
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({
        error: 'Failed to update chapter',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete chapter
   * @route DELETE /api/chapters/:id
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if chapter exists
      const existingChapter = await prisma.manualChapter.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      if (!existingChapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      // Verify tenant isolation
      if (user.role !== 'SUPER_ADMIN' && existingChapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied to this chapter' });
        return;
      }

      // Check if chapter has sections
      if (existingChapter._count.sections > 0) {
        res.status(400).json({
          error: 'Cannot delete chapter with existing sections',
          message: 'Please delete all sections first or deactivate the chapter instead',
        });
        return;
      }

      await prisma.manualChapter.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Chapter deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({
        error: 'Failed to delete chapter',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}