import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';

export class CategoryController {
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getCategories();
      res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTypesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await CategoryService.getTypesByCategory(String(req.params.id));
      res.status(200).json({
        status: 'success',
        data: { types },
      });
    } catch (error) {
      next(error);
    }
  }
}
