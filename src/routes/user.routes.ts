import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (ADMIN+)
 * @query   airlineId (optional, SUPER_ADMIN only)
 * @query   includeInactive (optional)
 */
router.get('/', requireAdmin, (req, res) => 
  userController.getAll(req, res)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN+)
 */
router.get('/:id', requireAdmin, (req, res) => 
  userController.getById(req, res)
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (ADMIN+)
 */
router.post('/', requireAdmin, (req, res) => 
  userController.create(req, res)
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (ADMIN+)
 */
router.put('/:id', requireAdmin, (req, res) => 
  userController.update(req, res)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user (soft delete)
 * @access  Private (ADMIN+)
 */
router.delete('/:id', requireAdmin, (req, res) => 
  userController.delete(req, res)
);

export default router;