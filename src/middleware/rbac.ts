import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiResponse } from '../utils/api-response';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        'You do not have permission to perform this action'
      );
    }

    next();
  };
};

// Specific role checkers
export const requireSuperAdmin = requireRole(Role.SUPER_ADMIN);
export const requireAdmin = requireRole(Role.SUPER_ADMIN, Role.ADMIN);
export const requireEditor = requireRole(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR);