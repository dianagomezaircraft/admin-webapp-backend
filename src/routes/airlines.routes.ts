import { Router } from 'express';
import { AirlineController } from '../controllers/airline.controller';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin, requireEditor } from '../middleware/rbac';

const router = Router();
const airlineController = new AirlineController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/airlines
 * @desc    Get all airlines
 * @access  Private (SUPER_ADMIN only)
 * @query   includeInactive (optional)
 *
 */
/**
 * @openapi
 * /api/airlines:
 *   get:
 *     summary: Get all airlines
 *     tags:
 *       - Airline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Include inactive airlines
 *     responses:
 *       200:
 *         description: List of airlines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Airline'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', requireSuperAdmin, (req, res) => 
  airlineController.getAll(req, res)
);

// /**
//  * @route   GET /api/airlines/:id/stats
//  * @desc    Get airline statistics
//  * @access  Private (SUPER_ADMIN or same airline)
//  */
// router.get('/:id/stats', requireEditor, (req, res) =>
//   airlineController.getStats(req, res)
// );

/**
 * @route   GET /api/airlines/:id
 * @desc    Get airline by ID
 * @access  Private (SUPER_ADMIN or same airline)
 */
/**
 * @openapi
 * /api/airlines/{id}:
 *   get:
 *     summary: Get airline by ID
 *     tags:
 *       - Airline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Airline found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Airline'
 *       404:
 *         description: Airline not found
 */
router.get('/:id', requireEditor, (req, res) => 
  airlineController.getById(req, res)
);

/**
 * @route   POST /api/airlines
 * @desc    Create new airline
 * @access  Private (SUPER_ADMIN only)
 */

/**
 * @openapi
 * /api/airlines:
 *   post:
 *     summary: Create a new airline
 *     tags:
 *       - Airline
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: AA
 *     responses:
 *       201:
 *         description: Airline created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Airline'
 *       400:
 *         description: Bad request
 */
router.post('/', requireSuperAdmin, (req, res) => 
  airlineController.create(req, res)
);

/**
 * @route   PUT /api/airlines/:id
 * @desc    Update airline
 * @access  Private (SUPER_ADMIN or same airline with restrictions)
 */
/**
 * @openapi
 * /api/airlines/{id}:
 *   put:
 *     summary: Update airline
 *     tags:
 *       - Airline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Airline'
 *     responses:
 *       200:
 *         description: Airline updated
 */
router.put('/:id', requireEditor, (req, res) => 
  airlineController.update(req, res)
);

/**
 * @route   DELETE /api/airlines/:id
 * @desc    Delete airline
 * @access  Private (SUPER_ADMIN only)
 */
/**
 * @openapi
 * /api/airlines/{id}:
 *   delete:
 *     summary: Delete airline
 *     tags:
 *       - Airline
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Airline deleted
 */
router.delete('/:id', requireSuperAdmin, (req, res) =>
  airlineController.delete(req, res)
);

// /**
//  * @route   POST /api/airlines/:id/logo
//  * @desc    Upload airline logo
//  * @access  Private (SUPER_ADMIN or same airline)
//  */
// router.post('/:id/logo', requireEditor, (req, res) =>
//   airlineController.uploadLogo(req, res)
// );

// /**
//  * @route   DELETE /api/airlines/:id/logo
//  * @desc    Delete airline logo
//  * @access  Private (SUPER_ADMIN or same airline)
//  */
// router.delete('/:id/logo', requireEditor, (req, res) =>
//   airlineController.deleteLogo(req, res)
// );

export default router;