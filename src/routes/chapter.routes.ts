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
 * @openapi
 * /api/chapters:
 *   get:
 *     summary: Get all chapters for an airline
 *     tags:
 *       - Chapters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: airlineId
 *         schema:
 *           type: string
 *         required: false
 *         description: Airline ID (optional for SUPER_ADMIN, ignored for other roles)
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Include inactive chapters in the response
 *     responses:
 *       200:
 *         description: List of chapters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   airlineId:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 */
router.get('/',  (req, res) =>
  chapterController.getAll(req, res)
);

/**
 * @openapi
 * /api/chapters/{id}:
 *   get:
 *     summary: Get chapter by ID
 *     tags:
 *       - Chapters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 airlineId:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 *       404:
 *         description: Chapter not found
 */
router.get('/:id', (req, res) =>
  chapterController.getById(req, res)
);

/**
 * @openapi
 * /api/chapters:
 *   post:
 *     summary: Create new chapter
 *     tags:
 *       - Chapters
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
 *               - airlineId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Chapter name
 *               airlineId:
 *                 type: string
 *                 description: ID of the airline this chapter belongs to
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the chapter is active
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 airlineId:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 */
router.post('/', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.create(req, res)
);

/**
 * @openapi
 * /api/chapters/{id}:
 *   put:
 *     summary: Update chapter
 *     tags:
 *       - Chapters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Chapter name
 *               isActive:
 *                 type: boolean
 *                 description: Whether the chapter is active
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 airlineId:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 *       404:
 *         description: Chapter not found
 */
router.put('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.update(req, res)
);

/**
 * @openapi
 * /api/chapters/{id}:
 *   delete:
 *     summary: Delete chapter
 *     tags:
 *       - Chapters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapter deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 *       404:
 *         description: Chapter not found
 */
router.delete('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  chapterController.delete(req, res)
);

export default router;