import { Request, Response } from 'express';
import { ManualService } from '../services/manual.service';
import { ApiResponse } from '../utils/api-response';
import { ContentType, Role } from '@prisma/client';

const manualService = new ManualService();

export class ContentController {
  async getAll(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';
      const airlineId = req.user?.airlineId;

      if (!airlineId && req.user?.role !== Role.SUPER_ADMIN) {
        return ApiResponse.forbidden(res);
      }

      const contents = await manualService.getAllContents(
        sectionId,
        airlineId!,
        includeInactive
      );
      return ApiResponse.success(res, contents);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const airlineId = req.user?.airlineId;

      if (!airlineId && req.user?.role !== Role.SUPER_ADMIN) {
        return ApiResponse.forbidden(res);
      }

      const content = await manualService.getContentById(id, airlineId!);
      return ApiResponse.success(res, content);
    } catch (error: any) {
      return ApiResponse.notFound(res, error.message);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const { title, type, content, order, metadata } = req.body;
      const airlineId = req.user?.airlineId;

      if (!title || !type || !content || order === undefined) {
        return ApiResponse.badRequest(
          res,
          'Title, type, content, and order are required'
        );
      }

      // Validate content type
      if (!Object.values(ContentType).includes(type)) {
        return ApiResponse.badRequest(
          res,
          `Invalid content type. Must be one of: ${Object.values(ContentType).join(', ')}`
        );
      }

      if (!airlineId && req.user?.role !== Role.SUPER_ADMIN) {
        return ApiResponse.forbidden(res);
      }

      const newContent = await manualService.createContent(sectionId, airlineId!, {
        title,
        type,
        content,
        order,
        metadata,
      });

      return ApiResponse.created(res, newContent, 'Content created successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, type, content, order, metadata, active } = req.body;
      const airlineId = req.user?.airlineId;

      // Validate content type if provided
      if (type && !Object.values(ContentType).includes(type)) {
        return ApiResponse.badRequest(
          res,
          `Invalid content type. Must be one of: ${Object.values(ContentType).join(', ')}`
        );
      }

      if (!airlineId && req.user?.role !== Role.SUPER_ADMIN) {
        return ApiResponse.forbidden(res);
      }

      const updatedContent = await manualService.updateContent(id, airlineId!, {
        title,
        type,
        content,
        order,
        metadata,
        active,
      });

      return ApiResponse.success(res, updatedContent, 'Content updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const airlineId = req.user?.airlineId;

      if (!airlineId && req.user?.role !== Role.SUPER_ADMIN) {
        return ApiResponse.forbidden(res);
      }

      await manualService.deleteContent(id, airlineId!);
      return ApiResponse.success(res, null, 'Content deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}