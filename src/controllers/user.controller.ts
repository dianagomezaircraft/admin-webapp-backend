import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    airlineId: string;
  };
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users
   * @route GET /api/users
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { airlineId, includeInactive } = req.query;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const users = await this.userService.getAll(
        user,
        airlineId as string,
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch users',
      });
    }
  }

  /**
   * Get user by ID
   * @route GET /api/users/:id
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const foundUser = await this.userService.getById(id, user);

      res.status(200).json({
        success: true,
        data: foundUser,
      });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch user',
      });
    }
  }

  /**
   * Create new user
   * @route POST /api/users
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const newUser = await this.userService.create(req.body, user);

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully',
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create user',
      });
    }
  }

  /**
   * Update user
   * @route PUT /api/users/:id
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updatedUser = await this.userService.update(id, req.body, user);

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update user',
      });
    }
  }

  /**
   * Delete user (soft delete by setting active to false)
   * @route DELETE /api/users/:id
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.userService.delete(id, user);

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete user',
      });
    }
  }
}