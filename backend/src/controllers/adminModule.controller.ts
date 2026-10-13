import { Response, NextFunction } from 'express';
import { AdminModuleService } from '../services/adminModule.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AdminModuleController {
  // Module Categories
  static async getModuleCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status } = req.query;
      const categories = await AdminModuleService.getModuleCategories({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
      });
      res.status(200).json({ status: 'success', data: { categories } });
    } catch (error) {
      next(error);
    }
  }

  static async getModuleCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminModuleService.getModuleCategoryById(String(req.params.id));
      res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async createModuleCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminModuleService.createModuleCategory(req.body, req.user!.id);
      res.status(201).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async updateModuleCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminModuleService.updateModuleCategory(String(req.params.id), req.body, req.user!.id);
      res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async updateModuleCategoryStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await AdminModuleService.updateModuleCategoryStatus(String(req.params.id), req.body.status, req.user!.id);
      res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteModuleCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminModuleService.deleteModuleCategory(String(req.params.id), req.user!.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  // Reusable Modules
  static async getModules(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, moduleCategoryId, status, minPrice, maxPrice, sortBy, page, limit } = req.query;
      const data = await AdminModuleService.getModules({
        search: search ? String(search) : undefined,
        moduleCategoryId: moduleCategoryId ? String(moduleCategoryId) : undefined,
        status: status ? String(status) : undefined,
        minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
        sortBy: sortBy ? String(sortBy) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getModuleById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const moduleDoc = await AdminModuleService.getModuleById(String(req.params.id));
      res.status(200).json({ status: 'success', data: { module: moduleDoc } });
    } catch (error) {
      next(error);
    }
  }

  static async createModule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const moduleDoc = await AdminModuleService.createModule(req.body, req.user!.id);
      res.status(201).json({ status: 'success', data: { module: moduleDoc } });
    } catch (error) {
      next(error);
    }
  }

  static async updateModule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const moduleDoc = await AdminModuleService.updateModule(String(req.params.id), req.body, req.user!.id);
      res.status(200).json({ status: 'success', data: { module: moduleDoc } });
    } catch (error) {
      next(error);
    }
  }

  static async updateModuleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const moduleDoc = await AdminModuleService.updateModuleStatus(String(req.params.id), req.body.status, req.user!.id);
      res.status(200).json({ status: 'success', data: { module: moduleDoc } });
    } catch (error) {
      next(error);
    }
  }

  static async updateModuleDependencies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const moduleDoc = await AdminModuleService.updateModuleDependencies(String(req.params.id), req.body.dependencies, req.user!.id);
      res.status(200).json({ status: 'success', data: { module: moduleDoc } });
    } catch (error) {
      next(error);
    }
  }

  static async updateModuleRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const moduleDoc = await AdminModuleService.updateModuleRecommendations(
        String(req.params.id),
        req.body.recommendedBusinessTypes,
        req.user!.id
      );
      res.status(200).json({ status: 'success', data: { module: moduleDoc } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteModule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminModuleService.deleteModule(String(req.params.id), req.user!.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}
