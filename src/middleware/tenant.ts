import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiResponse } from '../utils/api-response';

/**
 * Middleware to ensure users can only access their own airline's data
 * SUPER_ADMIN can access all airlines
 */
export const enforceTenantIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }

  // SUPER_ADMIN can access all airlines
  if (req.user.role === Role.SUPER_ADMIN) {
    return next();
  }

  // Other users must have an airlineId
  if (!req.user.airlineId) {
    return ApiResponse.forbidden(res, 'No airline association found');
  }

  // Check if trying to access another airline's data
  const requestedAirlineId = 
    req.params.airlineId || 
    req.body.airlineId || 
    req.query.airlineId;

  if (requestedAirlineId && requestedAirlineId !== req.user.airlineId) {
    return ApiResponse.forbidden(
      res,
      'You can only access your own airline data'
    );
  }

  next();
};