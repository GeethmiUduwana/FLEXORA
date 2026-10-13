import { BusinessCategory } from '../models/BusinessCategory.js';
import { BusinessType } from '../models/BusinessType.js';
import { CategoryStatus } from '../types/index.js';

export class CategoryService {
  static async getCategories() {
    const categories = await BusinessCategory.find({ status: CategoryStatus.ACTIVE })
      .sort({ displayOrder: 1, name: 1 });
    return categories.map((c) => c.toSafeJSON());
  }

  static async getTypesByCategory(categoryId: string) {
    const category = await BusinessCategory.findOne({
      _id: categoryId,
      status: CategoryStatus.ACTIVE,
    });

    if (!category) {
      const error: any = new Error('Category not found or is currently inactive');
      error.statusCode = 404;
      throw error;
    }

    const types = await BusinessType.find({
      categoryId: category._id,
      status: CategoryStatus.ACTIVE,
    }).sort({ isCustom: 1, name: 1 });

    return types.map((t) => t.toSafeJSON());
  }
}
