import { Router } from 'express';
import { ChapterController } from '../controllers/chapter.controller';
import { authenticate } from '../middleware/auth';
import { requireEditor } from '../middleware/rbac';
import { enforceTenantIsolation } from '../middleware/tenant';

const router = Router();
const chapterController = new ChapterController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/chapters
 * @desc    Get all chapters for an airline
 * @access  Private (Editor+)
 * @query   airlineId (optional for SUPER_ADMIN, ignored for others)
 * @query   includeInactive (optional)
 */
router.get('/', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.getAll(req, res)
);

/**
 * @route   GET /api/chapters/:id
 * @desc    Get chapter by ID
 * @access  Private (Editor+)
 */
router.get('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.getById(req, res)
);

/**
 * @route   POST /api/chapters
 * @desc    Create new chapter
 * @access  Private (Editor+)
 */
router.post('/', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.create(req, res)
);

/**
 * @route   PUT /api/chapters/:id
 * @desc    Update chapter
 * @access  Private (Editor+)
 */
router.put('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.update(req, res)
);

/**
 * @route   DELETE /api/chapters/:id
 * @desc    Delete chapter
 * @access  Private (Editor+)
 */
router.delete('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.delete(req, res)
);

export default router;