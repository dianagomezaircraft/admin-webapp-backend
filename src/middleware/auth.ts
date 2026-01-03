import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import {prisma} from '../config/database';
import { Role } from '@prisma/client';

// Extender el tipo Request para incluir el usuario
export interface AuthRequest extends Request {
  user?: any;
}

/**
 * AUTHENTICATE: Verify JWT token and attach user to request
 * Uso: Proteger rutas que requieren estar logueado
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    // 2. Obtener el token (quitar "Bearer ")
    const token = authHeader.substring(7);

    // 3. Verificar el token JWT
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // 4. Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { airline: true },
    });

    // 5. Validar que el usuario existe y está activo
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    // 6. Adjuntar usuario al request para usarlo en los controllers
    req.user = user;

    // 7. Continuar al siguiente middleware/controller
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * AUTHORIZE: Check if user has required role
 * Uso: Proteger rutas que requieren roles específicos
 * 
 * Ejemplo:
 * router.post('/airlines', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), createAirline)
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Verificar que el usuario está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // 2. Verificar que el usuario tiene alguno de los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    // 3. Usuario tiene permiso, continuar
    next();
  };
};