import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

/**
 * AUTH ROUTES
 * Base: /api/auth
 */

// POST /api/auth/login - Login con email y password
router.post('/login', authController.login);

// POST /api/auth/refresh - Renovar access token
router.post('/refresh', authController.refresh);

// POST /api/auth/logout - Logout (invalidar refresh token)
router.post('/logout', authController.logout);

// POST /api/auth/password-reset-request - Solicitar reset de password
router.post('/password-reset-request', authController.requestPasswordReset);

// POST /api/auth/password-reset - Resetear password con token
router.post('/password-reset', authController.resetPassword);

// GET /api/auth/me - Obtener info del usuario actual (requiere autenticación)
router.get('/me', authenticate, authController.me);

export default router;