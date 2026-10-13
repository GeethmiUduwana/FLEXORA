import { Response, NextFunction } from 'express';
import { BusinessService } from '../services/business.service.js';
import { AuthenticatedRequest, UserRole } from '../types/index.js';

export class BusinessController {
  static async createBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      // Security requirement: Only BUSINESS_OWNER can register businesses
      if (req.user.role !== UserRole.BUSINESS_OWNER) {
        res.status(403).json({
          status: 'error',
          message: 'Only Business Owners can register businesses',
        });
        return;
      }

      // ownerId is securely sourced from authenticated server-side session
      const business = await BusinessService.createBusiness(req.user.id, req.body);

      res.status(201).json({
        status: 'success',
        data: { business },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBusinesses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const businesses = await BusinessService.getMyBusinesses(req.user.id);

      res.status(200).json({
        status: 'success',
        data: { businesses },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const business = await BusinessService.getBusinessById(
        String(req.params.id),
        req.user.id,
        req.user.role
      );

      res.status(200).json({
        status: 'success',
        data: { business },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const business = await BusinessService.updateBusiness(
        String(req.params.id),
        req.user.id,
        req.user.role,
        req.body
      );

      res.status(200).json({
        status: 'success',
        data: { business },
      });
    } catch (error) {
      next(error);
    }
  }
}
