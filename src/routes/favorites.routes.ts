import { Router } from 'express';
import { FavoritesController } from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/tenant';

const router = Router();
const favoritesController = new FavoritesController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/favorites
 * @desc    Get all favorited chapters for the current user
 * @access  Private (any authenticated role)
 */
router.get('/', (req, res) =>
  favoritesController.getAll(req, res)
);

/**
 * @route   GET /api/favorites/ids
 * @desc    Get just the chapter IDs the current user has favorited
 *          (lightweight — used for rendering heart-toggle states)
 * @access  Private (any authenticated role)
 */
// NOTE: This route MUST be declared before /:chapterId to avoid
// Express matching "ids" as a chapterId param.
router.get('/ids', (req, res) =>
  favoritesController.getIds(req, res)
);

/**
 * @route   POST /api/favorites/:chapterId
 * @desc    Add a chapter to favorites (idempotent)
 * @access  Private (any authenticated role)
 */
router.post('/:chapterId', enforceTenantIsolation, (req, res) =>
  favoritesController.add(req, res)
);

/**
 * @route   DELETE /api/favorites/:chapterId
 * @desc    Remove a chapter from favorites
 * @access  Private (any authenticated role)
 */
router.delete('/:chapterId', enforceTenantIsolation, (req, res) =>
  favoritesController.remove(req, res)
);

export default router;