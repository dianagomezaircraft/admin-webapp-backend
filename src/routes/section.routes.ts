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
 * @openapi
 * /api/sections:
 *   get:
 *     summary: Get all sections for a chapter
 *     tags:
 *       - Sections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Include inactive sections in the response
 *     responses:
 *       200:
 *         description: List of sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       order:
 *                         type: integer
 *                       active:
 *                         type: boolean
 *                       chapterId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       400:
 *         description: Bad request - chapterId is required
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 */
router.get('/', (req, res) =>
  sectionController.getAll(req, res)
);

/**
 * @openapi
 * /api/sections/{id}:
 *   get:
 *     summary: Get section by ID
 *     tags:
 *       - Sections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     order:
 *                       type: integer
 *                     active:
 *                       type: boolean
 *                     chapterId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 *       404:
 *         description: Section not found
 */
router.get('/:id', (req, res) =>
  sectionController.getById(req, res)
);

/**
 * @openapi
 * /api/sections:
 *   post:
 *     summary: Create new section
 *     tags:
 *       - Sections
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - order
 *               - chapterId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Section title
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Section description
 *               order:
 *                 type: integer
 *                 description: Display order of the section (must be unique per chapter)
 *               chapterId:
 *                 type: string
 *                 description: Chapter ID this section belongs to
 *               active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the section is active
 *     responses:
 *       201:
 *         description: Section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     order:
 *                       type: integer
 *                     active:
 *                       type: boolean
 *                     chapterId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid input data or duplicate order number
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 */
router.post('/', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.create(req, res)
);

/**
 * @openapi
 * /api/sections/{id}:
 *   put:
 *     summary: Update section
 *     tags:
 *       - Sections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Section title
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Section description
 *               order:
 *                 type: integer
 *                 description: Display order of the section (must be unique per chapter)
 *               active:
 *                 type: boolean
 *                 description: Whether the section is active
 *     responses:
 *       200:
 *         description: Section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     order:
 *                       type: integer
 *                     active:
 *                       type: boolean
 *                     chapterId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid input data or duplicate order number
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 *       404:
 *         description: Section not found
 */
router.put('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.update(req, res)
);

/**
 * @openapi
 * /api/sections/{id}:
 *   delete:
 *     summary: Delete section
 *     tags:
 *       - Sections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Section deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions (requires Editor role or higher)
 *       404:
 *         description: Section not found
 */
router.delete('/:id', requireEditor, enforceTenantIsolation, (req, res) =>
  sectionController.delete(req, res)
);

export default router;