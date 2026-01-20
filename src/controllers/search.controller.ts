// controllers/search.controller.ts
import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

export class SearchController {
  // Global search across all chapters, sections, and content
  // GET /api/search?q=keyword&limit=50&includeInactive=false
  async globalSearch(req: Request, res: Response) {
    try {
      const user = (req as Request & { user?: { id: string; email: string; role: string; airlineId: string | null } }).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const includeInactive = req.query.includeInactive === 'true';

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query (q) is required',
        });
      }

      const results = await searchService.globalSearch(query, user as {
        id: string;
        email: string;
        role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';
        airlineId: string | null;
      }, {
        limit,
        includeInactive,
      });

      return res.status(200).json({
        success: true,
        data: results,
        count: results.length,
        query,
      });
    } catch (error) {
      console.error('Error in globalSearch:', error);
      const statusCode = (error as { statusCode?: number }).statusCode || 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      
      return res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  // Search within a specific chapter
  // GET /api/search/chapter/:chapterId?q=keyword
  async searchInChapter(req: Request, res: Response) {
    try {
      const user = (req as Request & { user?: { id: string; email: string; role: string; airlineId: string | null } }).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { chapterId } = req.params;
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query (q) is required',
        });
      }

      if (!chapterId) {
        return res.status(400).json({
          success: false,
          error: 'Chapter ID is required',
        });
      }

      const results = await searchService.searchInChapter(
        chapterId,
        query,
        user as {
          id: string;
          email: string;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';
          airlineId: string | null;
        }
      );

      return res.status(200).json({
        success: true,
        data: results,
        count: results.length,
        query,
        chapterId,
      });
    } catch (error) {
      console.error('Error in searchInChapter:', error);
      const statusCode = (error as { statusCode?: number }).statusCode || 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      
      return res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }
}