import { Response, NextFunction } from 'express';
import { AdminCategoryService } from '../services/adminCategory.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AdminCategoryController {
  // Categories
  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, sortBy } = req.query;
      const categories = await AdminCategoryService.getCategories({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        sortBy: sortBy ? String(sortBy) : undefined,
      });
      res.status(200).json({ status: 'success', data: { categories } });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminCategoryService.getCategoryById(String(req.params.id));
      res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminCategoryService.createCategory(req.body, req.user!.id);
      res.status(201).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminCategoryService.updateCategory(String(req.params.id), req.body, req.user!.id);
      res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategoryStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminCategoryService.updateCategoryStatus(String(req.params.id), req.body.status, req.user!.id);
      res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminCategoryService.deleteCategory(String(req.params.id), req.user!.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  // Business Types
  static async getBusinessTypes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, categoryId, status, page, limit } = req.query;
      const data = await AdminCategoryService.getBusinessTypes({
        search: search ? String(search) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        status: status ? String(status) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessTypeById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessType = await AdminCategoryService.getBusinessTypeById(String(req.params.id));
      res.status(200).json({ status: 'success', data: { businessType } });
    } catch (error) {
      next(error);
    }
  }

  static async createBusinessType(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessType = await AdminCategoryService.createBusinessType(req.body, req.user!.id);
      res.status(201).json({ status: 'success', data: { businessType } });
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessType(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessType = await AdminCategoryService.updateBusinessType(String(req.params.id), req.body, req.user!.id);
      res.status(200).json({ status: 'success', data: { businessType } });
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessTypeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessType = await AdminCategoryService.updateBusinessTypeStatus(String(req.params.id), req.body.status, req.user!.id);
      res.status(200).json({ status: 'success', data: { businessType } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBusinessType(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminCategoryService.deleteBusinessType(String(req.params.id), req.user!.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}
