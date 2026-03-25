import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * TemplateController
 * Handles template-related operations: fork, sync, merge
 */
export class TemplateController {
  
  /**
   * Get all available templates (chapters marked as templates)
   * @route GET /api/templates
   */
  async getAllTemplates(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const templates = await prisma.manualChapter.findMany({
        where: {
          isTemplate: true,
          active: true,
        },
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
              forkedChapters: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Mark a chapter as template (SUPER_ADMIN only)
   * @route POST /api/templates/:chapterId/mark-as-template
   */
  async markAsTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Only SUPER_ADMIN can mark chapters as templates
      if (user.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Only SUPER_ADMIN can create templates' });
        return;
      }

      const chapter = await prisma.manualChapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      // Can't mark a forked chapter as template
      if (chapter.templateId) {
        res.status(400).json({ 
          error: 'Cannot mark a forked chapter as template',
          message: 'Only original chapters can be templates' 
        });
        return;
      }

      const updatedChapter = await prisma.manualChapter.update({
        where: { id: chapterId },
        data: {
          isTemplate: true,
          templateVersion: 1,
        },
        include: {
          airline: true,
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: updatedChapter,
        message: 'Chapter marked as template successfully',
      });
    } catch (error) {
      console.error('Error marking chapter as template:', error);
      res.status(500).json({
        error: 'Failed to mark chapter as template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Fork a template chapter to a new airline
   * @route POST /api/templates/:templateId/fork
   */
  async forkTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const { targetAirlineId } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Determine target airline
      let airlineId: string;
      if (user.role === 'SUPER_ADMIN') {
        if (!targetAirlineId) {
          res.status(400).json({ error: 'targetAirlineId is required for SUPER_ADMIN' });
          return;
        }
        airlineId = targetAirlineId;
      } else {
        if (!user.airlineId) {
          res.status(400).json({ error: 'User has no airline assigned' });
          return;
        }
        airlineId = user.airlineId;
      }

      // Get the template chapter with its sections
      const template = await prisma.manualChapter.findUnique({
        where: { id: templateId },
        include: {
          sections: {
            where: { active: true },
            orderBy: { order: 'asc' },
            include: {
              contents: {
                where: { active: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      if (!template.isTemplate) {
        res.status(400).json({ error: 'Chapter is not marked as template' });
        return;
      }

      // Check if airline already has a fork of this template
      const existingFork = await prisma.manualChapter.findFirst({
        where: {
          templateId: templateId,
          airlineId: airlineId,
        },
      });

      if (existingFork) {
        res.status(400).json({ 
          error: 'Template already forked',
          message: 'This airline already has a copy of this template',
          existingChapterId: existingFork.id,
        });
        return;
      }

      // Get the next order number for the target airline
      const lastChapter = await prisma.manualChapter.findFirst({
        where: { airlineId },
        orderBy: { order: 'desc' },
      });
      const nextOrder = lastChapter ? lastChapter.order + 1 : 1;

      // Fork the chapter with all its sections and contents
      const forkedChapter = await prisma.manualChapter.create({
        data: {
          title: template.title,
          description: template.description,
          order: nextOrder,
          active: true,
          airlineId: airlineId,
          imageUrl: template.imageUrl,
          templateId: template.id,
          isTemplate: false,
          templateVersion: template.templateVersion,
          lastSyncedAt: new Date(),
          sections: {
            create: template.sections.map((section) => ({
              title: section.title,
              description: section.description,
              order: section.order,
              active: section.active,
              imageUrl: section.imageUrl,
              contents: {
                create: section.contents.map((content) => ({
                  title: content.title,
                  type: content.type,
                  content: content.content,
                  order: content.order,
                  active: content.active,
                  metadata: content.metadata || undefined,
                })),
              },
            })),
          },
        },
        include: {
          airline: true,
          template: {
            select: {
              id: true,
              title: true,
              airline: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: forkedChapter,
        message: 'Template forked successfully',
      });
    } catch (error) {
      console.error('Error forking template:', error);
      res.status(500).json({
        error: 'Failed to fork template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get pending template updates for a chapter
   * @route GET /api/templates/chapters/:chapterId/updates
   */
  async getPendingUpdates(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const chapter = await prisma.manualChapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      // Verify access
      if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const updates = await prisma.templateUpdate.findMany({
        where: {
          chapterId: chapterId,
          status: 'pending',
        },
        include: {
          template: {
            select: {
              id: true,
              title: true,
              templateVersion: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: updates,
        count: updates.length,
      });
    } catch (error) {
      console.error('Error fetching pending updates:', error);
      res.status(500).json({
        error: 'Failed to fetch pending updates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check for available updates from template
   * @route GET /api/templates/chapters/:chapterId/check-updates
   */
  async checkForUpdates(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const chapter = await prisma.manualChapter.findUnique({
        where: { id: chapterId },
        include: {
          template: true,
        },
      });

      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      if (!chapter.templateId || !chapter.template) {
        res.status(400).json({ 
          error: 'Chapter is not forked from a template',
          hasUpdates: false,
        });
        return;
      }

      // Verify access
      if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const hasUpdates = chapter.template.templateVersion > chapter.templateVersion;

      const changes = hasUpdates ? {
        currentVersion: chapter.templateVersion,
        latestVersion: chapter.template.templateVersion,
        templateTitle: chapter.template.title,
        templateLastUpdated: chapter.template.updatedAt,
        // You can add more detailed diff here
      } : null;

      res.status(200).json({
        success: true,
        hasUpdates,
        changes,
      });
    } catch (error) {
      console.error('Error checking for updates:', error);
      res.status(500).json({
        error: 'Failed to check for updates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Apply template update to a forked chapter
   * @route POST /api/templates/updates/:updateId/apply
   */
  async applyUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { updateId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const update = await prisma.templateUpdate.findUnique({
        where: { id: updateId },
        include: {
          chapter: true,
          template: true,
        },
      });

      if (!update) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }

      // Verify access
      if (user.role !== 'SUPER_ADMIN' && update.chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (update.status !== 'pending') {
        res.status(400).json({ error: 'Update already processed' });
        return;
      }

      // Apply the changes from the template
      const changes = update.changes as any;
      
      const updatedChapter = await prisma.$transaction(async (tx) => {
        // Update the chapter
        const chapter = await tx.manualChapter.update({
          where: { id: update.chapterId },
          data: {
            title: changes.title || update.chapter.title,
            description: changes.description !== undefined ? changes.description : update.chapter.description,
            imageUrl: changes.imageUrl !== undefined ? changes.imageUrl : update.chapter.imageUrl,
            templateVersion: update.template.templateVersion,
            lastSyncedAt: new Date(),
          },
        });

        // Mark update as approved
        await tx.templateUpdate.update({
          where: { id: updateId },
          data: {
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: user.id,
          },
        });

        return chapter;
      });

      res.status(200).json({
        success: true,
        data: updatedChapter,
        message: 'Update applied successfully',
      });
    } catch (error) {
      console.error('Error applying update:', error);
      res.status(500).json({
        error: 'Failed to apply update',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Reject a template update
   * @route POST /api/templates/updates/:updateId/reject
   */
  async rejectUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { updateId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const update = await prisma.templateUpdate.findUnique({
        where: { id: updateId },
        include: {
          chapter: true,
        },
      });

      if (!update) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }

      // Verify access
      if (user.role !== 'SUPER_ADMIN' && update.chapter.airlineId !== user.airlineId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (update.status !== 'pending') {
        res.status(400).json({ error: 'Update already processed' });
        return;
      }

      const rejectedUpdate = await prisma.templateUpdate.update({
        where: { id: updateId },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      });

      res.status(200).json({
        success: true,
        data: rejectedUpdate,
        message: 'Update rejected successfully',
      });
    } catch (error) {
      console.error('Error rejecting update:', error);
      res.status(500).json({
        error: 'Failed to reject update',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all chapters forked from a template
   * @route GET /api/templates/:templateId/forks
   */
  async getTemplateForks(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const forks = await prisma.manualChapter.findMany({
        where: {
          templateId: templateId,
        },
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
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: forks,
        count: forks.length,
      });
    } catch (error) {
      console.error('Error fetching template forks:', error);
      res.status(500).json({
        error: 'Failed to fetch template forks',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }


  /**
 * Get sync status of all forks for a template
 * @route GET /api/templates/:templateId/sync-status
 */
async getTemplateSyncStatus(req: Request, res: Response): Promise<void> {
  try {
    const { templateId } = req.params;
    const user = req.user;

    if (!user || user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'SUPER_ADMIN only' });
      return;
    }

    const template = await prisma.manualChapter.findUnique({
      where: { id: templateId },
      select: { id: true, title: true, templateVersion: true },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const forks = await prisma.manualChapter.findMany({
      where: { templateId },
      include: {
        airline: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const forksWithStatus = forks.map((fork) => ({
      id: fork.id,
      title: fork.title,
      airline: fork.airline,
      forkVersion: fork.templateVersion,
      templateVersion: template.templateVersion,
      isOutdated: fork.templateVersion < template.templateVersion,
      lastSyncedAt: fork.lastSyncedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        template,
        forks: forksWithStatus,
        outdatedCount: forksWithStatus.filter((f) => f.isOutdated).length,
        totalForks: forks.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
}

/**
 * Push template update to all outdated forks (overwrite)
 * @route POST /api/templates/:templateId/push-to-forks
 */
async pushToAllForks(req: Request, res: Response): Promise<void> {
  try {
    const { templateId } = req.params;
    const { forkIds } = req.body; // optional: specific fork IDs, else all outdated
    const user = req.user;

    if (!user || user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'SUPER_ADMIN only' });
      return;
    }

    // Get template with full content
    const template = await prisma.manualChapter.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          where: { active: true },
          orderBy: { order: 'asc' },
          include: {
            contents: {
              where: { active: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!template || !template.isTemplate) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Determine which forks to update
    const whereClause: any = { templateId };
    if (forkIds && forkIds.length > 0) {
      whereClause.id = { in: forkIds };
    } else {
      // Only outdated forks
      whereClause.templateVersion = { lt: template.templateVersion };
    }

    const forksToUpdate = await prisma.manualChapter.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (forksToUpdate.length === 0) {
      res.status(200).json({
        success: true,
        message: 'All forks are already up to date',
        results: [],
      });
      return;
    }

    // Process each fork in parallel
    const results = await Promise.allSettled(
      forksToUpdate.map(async (fork) => {
        return prisma.$transaction(async (tx) => {
          // 1. Delete existing sections + contents of fork
          const existingSections = await tx.manualSection.findMany({
            where: { chapterId: fork.id },
            select: { id: true },
          });
          await tx.manualContent.deleteMany({
            where: { sectionId: { in: existingSections.map((s) => s.id) } },
          });
          await tx.manualSection.deleteMany({
            where: { chapterId: fork.id },
          });

          // 2. Re-create sections + contents from template
          for (const section of template.sections) {
            await tx.manualSection.create({
              data: {
                title: section.title,
                description: section.description,
                order: section.order,
                active: section.active,
                imageUrl: section.imageUrl,
                chapterId: fork.id,
                contents: {
                  create: section.contents.map((c) => ({
                    title: c.title,
                    type: c.type,
                    content: c.content,
                    order: c.order,
                    active: c.active,
                    metadata: c.metadata || undefined,
                  })),
                },
              },
            });
          }

          // 3. Update fork metadata
          await tx.manualChapter.update({
            where: { id: fork.id },
            data: {
              title: template.title,
              description: template.description,
              imageUrl: template.imageUrl,
              templateVersion: template.templateVersion,
              lastSyncedAt: new Date(),
            },
          });

          // 4. Log the sync as a TemplateUpdate record
          await tx.templateUpdate.create({
            data: {
              chapterId: fork.id,
              templateId: template.id,
              status: 'approved',
              changes: {
                title: template.title,
                description: template.description,
                imageUrl: template.imageUrl,
              },
              reviewedAt: new Date(),
              reviewedBy: user.id,
            },
          });

          return fork.id;
        });
      })
    );

    const succeeded = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<string>).value);

    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r, i) => ({
        forkId: forksToUpdate[i].id,
        error: (r as PromiseRejectedResult).reason?.message,
      }));

    res.status(200).json({
      success: true,
      data: { succeeded, failed },
      message: `Synced ${succeeded.length} forks, ${failed.length} failed`,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to push updates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  }
  
}