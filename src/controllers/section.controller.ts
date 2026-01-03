import { Request, Response } from 'express';
import { SectionService } from '../services/section.service';



export class SectionController {
  private sectionService: SectionService;

  constructor() {
    this.sectionService = new SectionService();
  }

  /**
   * Get all sections for a chapter
   * @route GET /api/sections
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId, includeInactive } = req.query;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!chapterId) {
        res.status(400).json({ error: 'chapterId query parameter is required' });
        return;
      }

      const sections = await this.sectionService.getAll(
        chapterId as string,
        user,
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        data: sections,
        count: sections.length,
      });
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch sections',
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

      const section = await this.sectionService.getById(id, user);

      res.status(200).json({
        success: true,
        data: section,
      });
    } catch (error: any) {
      console.error('Error fetching section:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch section',
      });
    }
  }

  /**
   * Create new section
   * @route POST /api/sections
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const section = await this.sectionService.create(req.body, user);

      res.status(201).json({
        success: true,
        data: section,
        message: 'Section created successfully',
      });
    } catch (error: any) {
      console.error('Error creating section:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create section',
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

      const section = await this.sectionService.update(id, req.body, user);

      res.status(200).json({
        success: true,
        data: section,
        message: 'Section updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating section:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update section',
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

      await this.sectionService.delete(id, user);

      res.status(200).json({
        success: true,
        message: 'Section deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting section:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete section',
      });
    }
  }
}