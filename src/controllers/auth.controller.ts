import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS (usando Zod)
// ============================================

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// ============================================
// CONTROLLER
// ============================================

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  login = async (req: Request, res: Response) => {
    try {
      // Validar request body
      const { email, password } = loginSchema.parse(req.body);

      // Ejecutar login
      const result = await this.authService.login(email, password);

      // Respuesta exitosa
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      // Manejar errores
      const statusCode = error.message === 'Invalid credentials' ? 401 : 400;
      
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  };

  /**
   * POST /api/auth/refresh
   * Get new access token using refresh token
   */
  refresh = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);

      const result = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Invalid refresh token',
      });
    }
  };

  /**
   * POST /api/auth/logout
   * Invalidate refresh token
   */
  logout = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * POST /api/auth/password-reset-request
   * Request password reset email
   */
  requestPasswordReset = async (req: Request, res: Response) => {
    try {
      const { email } = resetRequestSchema.parse(req.body);

      await this.authService.requestPasswordReset(email);

      // Siempre retornar éxito (no revelar si el email existe)
      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * POST /api/auth/password-reset
   * Reset password using token
   */
  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      await this.authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Invalid or expired token',
      });
    }
  };

  /**
   * GET /api/auth/me
   * Get current user info (requires authentication)
   */
  me = async (req: Request, res: Response) => {
    try {
      // El usuario ya viene del middleware de autenticación
      const user = (req as any).user;

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          airlineId: user.airlineId,
          airline: user.airline,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}