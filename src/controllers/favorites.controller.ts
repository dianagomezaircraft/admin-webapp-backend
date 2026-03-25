import { Request, Response } from 'express';
import { FavoritesService } from '../services/favorites.service';

const favoritesService = new FavoritesService();

export class FavoritesController {
  /**
   * GET /api/favorites
   * Returns all favorited chapters for the authenticated user.
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const favorites = await favoritesService.getAll(user);
      res.json(favorites);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch favorites' });
    }
  }

  /**
   * GET /api/favorites/ids
   * Returns only the chapter IDs the user has favorited.
   * Lightweight — used for heart-toggle states across the app.
   */
  async getIds(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const ids = await favoritesService.getFavoriteIds(user);
      res.json(ids);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch favorite IDs' });
    }
  }

  /**
   * POST /api/favorites/:chapterId
   * Adds a chapter to the user's favorites (idempotent).
   */
  async add(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const user = (req as any).user;
      const favorite = await favoritesService.add(chapterId, user);
      res.status(201).json(favorite);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to add favorite' });
    }
  }

  /**
   * DELETE /api/favorites/:chapterId
   * Removes a chapter from the user's favorites.
   */
  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const user = (req as any).user;
      await favoritesService.remove(chapterId, user);
      res.json({ success: true });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to remove favorite' });
    }
  }
}