// routes/search.routes.ts
import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const searchController = new SearchController();

/**
 * @route   GET /api/search
 * @desc    Global search across chapters, sections, and content
 * @access  Private (requires authentication)
 * @query   q - Search query (required)
 * @query   limit - Maximum number of results (optional, default: 50)
 * @query   includeInactive - Include inactive items (optional, default: false)
 * 
 * Example: GET /api/search?q=emergency&limit=20
 */
router.get('/', authenticate, (req, res) => searchController.globalSearch(req, res));

/**
 * @route   GET /api/search/chapter/:chapterId
 * @desc    Search within a specific chapter
 * @access  Private (requires authentication)
 * @param   chapterId - Chapter ID
 * @query   q - Search query (required)
 * 
 * Example: GET /api/search/chapter/123abc?q=fire
 */
router.get('/chapter/:chapterId', authenticate, (req, res) => searchController.searchInChapter(req, res));

export default router;