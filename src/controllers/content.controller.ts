import { Request, Response } from 'express';
import { ManualService } from '../services/manual.service';
import { ApiResponse } from '../utils/api-response';
import { ContentType, Role } from '@prisma/client';
import { bumpTemplateVersionIfNeeded } from '../lib/template-version'; // ✅ Import

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

      const contents = await manualService.getAllContents(sectionId, includeInactive);
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
        return ApiResponse.badRequest(res, 'Title, type, content, and order are required');
      }

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

      // ✅ Bump template version — sectionId is already in req.params
      const chapterId = await manualService.getChapterIdBySectionId(sectionId);
      if (chapterId) await bumpTemplateVersionIfNeeded(chapterId);

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

      // ✅ sectionId is a flat field on the returned content record
      const chapterId = await manualService.getChapterIdBySectionId(
        updatedContent.sectionId
      );
      if (chapterId) await bumpTemplateVersionIfNeeded(chapterId);

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

      // ✅ Fetch content BEFORE deleting so we can still read sectionId
      const existingContent = await manualService.getContentById(id, airlineId!);
      const chapterId = await manualService.getChapterIdBySectionId(
        existingContent.sectionId  // sectionId is a flat field, no relation needed
      );

      await manualService.deleteContent(id, airlineId!);

      // ✅ Bump after confirming deletion succeeded
      if (chapterId) await bumpTemplateVersionIfNeeded(chapterId);

      return ApiResponse.success(res, null, 'Content deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}