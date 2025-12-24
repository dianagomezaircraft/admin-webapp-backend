import { Router } from 'express';
import { SectionController } from '../controllers/section.controller';
import { authenticate } from '../middleware/auth';
import { requireEditor } from '../middleware/rbac';
import { enforceTenantIsolation } from '../middleware/tenant';

const router = Router();
const sectionController = new SectionController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/chapters/:chapterId/sections
 * @desc    Get all sections for a chapter
 * @access  Private (Editor+)
 */
router.get('/chapters/:chapterId/sections', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.getAll(req, res)
);

/**
 * @route   GET /api/sections/:id
 * @desc    Get section by ID
 * @access  Private (Editor+)
 */
router.get('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.getById(req, res)
);

/**
 * @route   POST /api/chapters/:chapterId/sections
 * @desc    Create new section
 * @access  Private (Editor+)
 */
router.post('/chapters/:chapterId/sections', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.create(req, res)
);

/**
 * @route   PUT /api/sections/:id
 * @desc    Update section
 * @access  Private (Editor+)
 */
router.put('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.update(req, res)
);

/**
 * @route   DELETE /api/sections/:id
 * @desc    Delete section
 * @access  Private (Editor+)
 */
router.delete('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.delete(req, res)
);

export default router;