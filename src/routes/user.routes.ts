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
 * @desc    Get all users (filtered by airline for non-SUPER_ADMIN)
 * @access  Private (Admin+)
 */
router.get('/', requireAdmin, (req, res) => userController.getAll(req, res));

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin+)
 */
router.get('/:id', requireAdmin, (req, res) => userController.getById(req, res));

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin+)
 */
router.post('/', requireAdmin, (req, res) => userController.create(req, res));

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin+)
 */
router.put('/:id', requireAdmin, (req, res) => userController.update(req, res));

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin+)
 */
router.delete('/:id', requireAdmin, (req, res) => userController.delete(req, res));

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin+)
 */
router.patch('/:id/deactivate', requireAdmin, (req, res) =>
  userController.deactivate(req, res)
);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin+)
 */
router.patch('/:id/activate', requireAdmin, (req, res) =>
  userController.activate(req, res)
);

/**
 * @route   PATCH /api/users/:id/password
 * @desc    Change user password
 * @access  Private (User can change own, Admin+ can change any)
 */
router.patch('/:id/password', (req, res) => userController.changePassword(req, res));

export default router;