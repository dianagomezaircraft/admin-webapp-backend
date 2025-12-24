import { Request, Response } from 'express';
import { AirlineService } from '../services/airline.service';
import { ApiResponse } from '../utils/api-response';

const airlineService = new AirlineService();

export class AirlineController {
  async getAll(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const airlines = await airlineService.getAll(includeInactive);
      return ApiResponse.success(res, airlines);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const airline = await airlineService.getById(id);
      return ApiResponse.success(res, airline);
    } catch (error: any) {
      return ApiResponse.notFound(res, error.message);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, code, logo, branding } = req.body;

      if (!name || !code) {
        return ApiResponse.badRequest(res, 'Name and code are required');
      }

      const airline = await airlineService.create({
        name,
        code,
        logo,
        branding,
      });

      return ApiResponse.created(res, airline, 'Airline created successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, logo, branding, active } = req.body;

      const airline = await airlineService.update(id, {
        name,
        logo,
        branding,
        active,
      });

      return ApiResponse.success(res, airline, 'Airline updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await airlineService.delete(id);
      return ApiResponse.success(res, null, 'Airline deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async deactivate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const airline = await airlineService.deactivate(id);
      return ApiResponse.success(res, airline, 'Airline deactivated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async activate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const airline = await airlineService.activate(id);
      return ApiResponse.success(res, airline, 'Airline activated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}