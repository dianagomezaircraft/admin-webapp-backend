import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/api-response';



export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const airlineId = req.query.airlineId as string | undefined;
      const includeInactive = req.query.includeInactive === 'true';

      const users = await this.userService.getAll(req.user, airlineId, includeInactive);
      return ApiResponse.success(res, users);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, error.statusCode || 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const { id } = req.params;
      const user = await this.userService.getById(id, req.user);
      return ApiResponse.success(res, user);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, error.statusCode || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const user = await this.userService.create(req.body, req.user);
      return ApiResponse.created(res, user, 'User created successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, error.statusCode || 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const { id } = req.params;
      const user = await this.userService.update(id, req.body, req.user);
      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, error.statusCode || 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const { id } = req.params;
      await this.userService.delete(id, req.user);
      return ApiResponse.success(res, null, 'User deactivated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, error.statusCode || 500);
    }
  }
}