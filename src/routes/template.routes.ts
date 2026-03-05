import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';
import { authenticate } from '../middleware/auth';
import { requireEditor, requireSuperAdmin } from '../middleware/rbac';

const router = Router();
const templateController = new TemplateController();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/templates
 * @desc Get all available templates
 * @access Editor+
 */
router.get('/', requireEditor, (req, res) =>
  templateController.getAllTemplates(req, res)
);

/**
 * @route POST /api/templates/:chapterId/mark-as-template
 * @desc Mark a chapter as template (SUPER_ADMIN only)
 * @access SUPER_ADMIN
 */
router.post('/:chapterId/mark-as-template', requireSuperAdmin, (req, res) =>
  templateController.markAsTemplate(req, res)
);

/**
 * @route POST /api/templates/:templateId/fork
 * @desc Fork a template to create a copy for an airline
 * @access Editor+
 */
router.post('/:templateId/fork', requireEditor, (req, res) =>
  templateController.forkTemplate(req, res)
);

/**
 * @route GET /api/templates/:templateId/forks
 * @desc Get all forks of a template
 * @access Editor+
 */
router.get('/:templateId/forks', requireEditor, (req, res) =>
  templateController.getTemplateForks(req, res)
);

/**
 * @route GET /api/templates/chapters/:chapterId/updates
 * @desc Get pending template updates for a chapter
 * @access Editor+
 */
router.get('/chapters/:chapterId/updates', requireEditor, (req, res) =>
  templateController.getPendingUpdates(req, res)
);

/**
 * @route GET /api/templates/chapters/:chapterId/check-updates
 * @desc Check if there are updates available from template
 * @access Editor+
 */
router.get('/chapters/:chapterId/check-updates', requireEditor, (req, res) =>
  templateController.checkForUpdates(req, res)
);

/**
 * @route POST /api/templates/updates/:updateId/apply
 * @desc Apply a template update to a forked chapter
 * @access Editor+
 */
router.post('/updates/:updateId/apply', requireEditor, (req, res) =>
  templateController.applyUpdate(req, res)
);

/**
 * @route POST /api/templates/updates/:updateId/reject
 * @desc Reject a template update
 * @access Editor+
 */
router.post('/updates/:updateId/reject', requireEditor, (req, res) =>
  templateController.rejectUpdate(req, res)
);

export default router;