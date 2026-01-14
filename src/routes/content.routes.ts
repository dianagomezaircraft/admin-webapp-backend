import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';
import { requireEditor } from '../middleware/rbac';
import { enforceTenantIsolation } from '../middleware/tenant';

const router = Router();
const contentController = new ContentController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/contents/sections/:sectionId/
 * @desc    Get all contents for a section
 * @access  Private (Editor+)
 */
router.get('/sections/:sectionId', requireEditor, enforceTenantIsolation, (req, res) =>
  contentController.getAll(req, res)
);

/**
 * @route   GET /api/contents/:id
 * @desc    Get content by ID
 * @access  Private (Editor+)
 */
router.get('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  contentController.getById(req, res)
);

/**
 * @route   POST /api/contents/sections/:sectionId/contents
 * @desc    Create new content
 * @access  Private (Editor+)
 */
router.post('/sections/:sectionId/contents', requireEditor, enforceTenantIsolation, (req, res) =>
  contentController.create(req, res)
);

/**
 * @route   PUT /api/contents/:id
 * @desc    Update content
 * @access  Private (Editor+)
 */
router.put('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  contentController.update(req, res)
);

/**
 * @route   DELETE /api/contents/:id
 * @desc    Delete content
 * @access  Private (Editor+)
 */
router.delete('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  contentController.delete(req, res)
);

export default router;