import { Types } from 'mongoose';
import { BusinessCategory } from '../models/BusinessCategory.js';
import { BusinessType } from '../models/BusinessType.js';
import { Business } from '../models/Business.js';
import { AuditLog } from '../models/AuditLog.js';
import { CategoryStatus, AuditAction } from '../types/index.js';
import { slugify } from '../utils/slug.js';

export class AdminCategoryService {
  // ==================== BUSINESS CATEGORIES ====================

  static async getCategories(query: { search?: string; status?: string; sortBy?: string }) {
    const filter: Record<string, any> = {};

    if (query.status && Object.values(CategoryStatus).includes(query.status as CategoryStatus)) {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { slug: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const sortOptions: Record<string, any> = {};
    if (query.sortBy === 'name') {
      sortOptions.name = 1;
    } else {
      sortOptions.displayOrder = 1;
      sortOptions.name = 1;
    }

    const categories = await BusinessCategory.find(filter).sort(sortOptions);

    // Aggregate business type counts per category
    const typeCounts = await BusinessType.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    typeCounts.forEach((tc) => countMap.set(tc._id.toString(), tc.count));

    return categories.map((cat) => {
      const json = cat.toSafeJSON();
      return {
        ...json,
        businessTypeCount: countMap.get(cat._id.toString()) || 0,
      };
    });
  }

  static async getCategoryById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    const category = await BusinessCategory.findById(id);
    if (!category) {
      const error: any = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    const businessTypeCount = await BusinessType.countDocuments({ categoryId: category._id });
    return {
      ...category.toSafeJSON(),
      businessTypeCount,
    };
  }

  static async createCategory(data: any, adminId: string) {
    const baseSlug = slugify(data.name);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await BusinessCategory.exists({ slug: uniqueSlug })) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    const category = new BusinessCategory({
      name: data.name.trim(),
      slug: uniqueSlug,
      description: data.description ? data.description.trim() : '',
      icon: data.icon ? data.icon.trim() : 'Layers',
      status: data.status || CategoryStatus.ACTIVE,
      displayOrder: data.displayOrder ?? 0,
    });

    await category.save();

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.CREATE,
      entityType: 'BusinessCategory',
      entityId: category._id.toString(),
      details: { name: category.name, slug: category.slug },
    });

    return category.toSafeJSON();
  }

  static async updateCategory(id: string, data: any, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    const category = await BusinessCategory.findById(id);
    if (!category) {
      const error: any = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.name && data.name.trim() !== category.name) {
      const baseSlug = slugify(data.name);
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await BusinessCategory.exists({
          slug: uniqueSlug,
          _id: { $ne: category._id },
        })
      ) {
        counter++;
        uniqueSlug = `${baseSlug}-${counter}`;
      }
      category.name = data.name.trim();
      category.slug = uniqueSlug;
    }

    if (data.description !== undefined) category.description = data.description.trim();
    if (data.icon !== undefined) category.icon = data.icon.trim();
    if (data.status !== undefined) category.status = data.status;
    if (data.displayOrder !== undefined) category.displayOrder = data.displayOrder;

    await category.save();

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.UPDATE,
      entityType: 'BusinessCategory',
      entityId: category._id.toString(),
      details: data,
    });

    return category.toSafeJSON();
  }

  static async updateCategoryStatus(id: string, status: CategoryStatus, adminId: string) {
    return this.updateCategory(id, { status }, adminId);
  }

  static async deleteCategory(id: string, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    const category = await BusinessCategory.findById(id);
    if (!category) {
      const error: any = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    // Safety checks: Cannot delete if referenced by business types or businesses
    const [associatedTypes, associatedBusinesses] = await Promise.all([
      BusinessType.countDocuments({ categoryId: category._id }),
      Business.countDocuments({ categoryId: category._id }),
    ]);

    if (associatedTypes > 0 || associatedBusinesses > 0) {
      const reasons: string[] = [];
      if (associatedTypes > 0) reasons.push(`${associatedTypes} business type(s)`);
      if (associatedBusinesses > 0) reasons.push(`${associatedBusinesses} registered business(es)`);

      const error: any = new Error(
        `Cannot delete category because it is referenced by ${reasons.join(' and ')}. Deactivate the category instead to preserve historical records.`
      );
      error.statusCode = 400;
      throw error;
    }

    await BusinessCategory.findByIdAndDelete(id);

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.DELETE,
      entityType: 'BusinessCategory',
      entityId: id,
      details: { name: category.name },
    });

    return { message: 'Category deleted successfully' };
  }

  // ==================== BUSINESS TYPES ====================

  static async getBusinessTypes(query: {
    search?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status && Object.values(CategoryStatus).includes(query.status as CategoryStatus)) {
      filter.status = query.status;
    }

    if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { slug: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [totalCount, businessTypes] = await Promise.all([
      BusinessType.countDocuments(filter),
      BusinessType.find(filter)
        .populate('categoryId', 'name slug status')
        .sort({ 'categoryId.name': 1, name: 1 })
        .skip(skip)
        .limit(limit),
    ]);

    // Aggregate business counts per business type
    const businessCounts = await Business.aggregate([
      { $group: { _id: '$businessTypeId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    businessCounts.forEach((bc) => {
      if (bc._id) countMap.set(bc._id.toString(), bc.count);
    });

    const items = businessTypes.map((bt) => {
      const json = bt.toSafeJSON();
      return {
        ...json,
        category: bt.categoryId ? (bt.categoryId as any).toSafeJSON?.() || bt.categoryId : undefined,
        businessCount: countMap.get(bt._id.toString()) || 0,
      };
    });

    return {
      businessTypes: items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  static async getBusinessTypeById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Business type not found');
      error.statusCode = 404;
      throw error;
    }

    const bt = await BusinessType.findById(id).populate('categoryId', 'name slug status');
    if (!bt) {
      const error: any = new Error('Business type not found');
      error.statusCode = 404;
      throw error;
    }

    const businessCount = await Business.countDocuments({ businessTypeId: bt._id });

    return {
      ...bt.toSafeJSON(),
      category: bt.categoryId ? (bt.categoryId as any).toSafeJSON?.() || bt.categoryId : undefined,
      businessCount,
    };
  }

  static async createBusinessType(data: any, adminId: string) {
    if (!Types.ObjectId.isValid(data.categoryId)) {
      const error: any = new Error('Invalid category ID');
      error.statusCode = 400;
      throw error;
    }

    const category = await BusinessCategory.findById(data.categoryId);
    if (!category) {
      const error: any = new Error('Assigned category not found');
      error.statusCode = 404;
      throw error;
    }

    if (category.status !== CategoryStatus.ACTIVE) {
      const error: any = new Error('Cannot assign business type to an inactive category');
      error.statusCode = 400;
      throw error;
    }

    const baseSlug = slugify(data.name);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await BusinessType.exists({ categoryId: category._id, slug: uniqueSlug })) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    const businessType = new BusinessType({
      name: data.name.trim(),
      slug: uniqueSlug,
      categoryId: category._id,
      description: data.description ? data.description.trim() : '',
      status: data.status || CategoryStatus.ACTIVE,
      isCustom: Boolean(data.isCustom),
    });

    await businessType.save();

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.CREATE,
      entityType: 'BusinessType',
      entityId: businessType._id.toString(),
      details: { name: businessType.name, categoryId: category._id.toString() },
    });

    await businessType.populate('categoryId', 'name slug status');
    return {
      ...businessType.toSafeJSON(),
      category: (businessType.categoryId as any)?.toSafeJSON?.() || businessType.categoryId,
    };
  }

  static async updateBusinessType(id: string, data: any, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Business type not found');
      error.statusCode = 404;
      throw error;
    }

    const businessType = await BusinessType.findById(id);
    if (!businessType) {
      const error: any = new Error('Business type not found');
      error.statusCode = 404;
      throw error;
    }

    let targetCategoryId = businessType.categoryId;
    if (data.categoryId && data.categoryId.toString() !== businessType.categoryId.toString()) {
      if (!Types.ObjectId.isValid(data.categoryId)) {
        const error: any = new Error('Invalid category ID');
        error.statusCode = 400;
        throw error;
      }

      const targetCategory = await BusinessCategory.findById(data.categoryId);
      if (!targetCategory) {
        const error: any = new Error('Target category not found');
        error.statusCode = 404;
        throw error;
      }

      if (targetCategory.status !== CategoryStatus.ACTIVE) {
        const error: any = new Error('Cannot move business type to an inactive category');
        error.statusCode = 400;
        throw error;
      }

      targetCategoryId = targetCategory._id;
      businessType.categoryId = targetCategoryId;
    }

    if (data.name && data.name.trim() !== businessType.name) {
      const baseSlug = slugify(data.name);
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await BusinessType.exists({
          categoryId: targetCategoryId,
          slug: uniqueSlug,
          _id: { $ne: businessType._id },
        })
      ) {
        counter++;
        uniqueSlug = `${baseSlug}-${counter}`;
      }
      businessType.name = data.name.trim();
      businessType.slug = uniqueSlug;
    }

    if (data.description !== undefined) businessType.description = data.description.trim();
    if (data.status !== undefined) businessType.status = data.status;
    if (data.isCustom !== undefined) businessType.isCustom = Boolean(data.isCustom);

    await businessType.save();

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.UPDATE,
      entityType: 'BusinessType',
      entityId: businessType._id.toString(),
      details: data,
    });

    await businessType.populate('categoryId', 'name slug status');
    return {
      ...businessType.toSafeJSON(),
      category: (businessType.categoryId as any)?.toSafeJSON?.() || businessType.categoryId,
    };
  }

  static async updateBusinessTypeStatus(id: string, status: CategoryStatus, adminId: string) {
    return this.updateBusinessType(id, { status }, adminId);
  }

  static async deleteBusinessType(id: string, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Business type not found');
      error.statusCode = 404;
      throw error;
    }

    const businessType = await BusinessType.findById(id);
    if (!businessType) {
      const error: any = new Error('Business type not found');
      error.statusCode = 404;
      throw error;
    }

    const usedCount = await Business.countDocuments({ businessTypeId: businessType._id });
    if (usedCount > 0) {
      const error: any = new Error(
        `Cannot delete business type because it is actively used by ${usedCount} registered business(es). Deactivate it instead.`
      );
      error.statusCode = 400;
      throw error;
    }

    await BusinessType.findByIdAndDelete(id);

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.DELETE,
      entityType: 'BusinessType',
      entityId: id,
      details: { name: businessType.name },
    });

    return { message: 'Business type deleted successfully' };
  }
}
