import { Types } from 'mongoose';
import { ModuleCategory } from '../models/ModuleCategory.js';
import { BusinessModule } from '../models/BusinessModule.js';
import { BusinessType } from '../models/BusinessType.js';
import { AuditLog } from '../models/AuditLog.js';
import { CategoryStatus, ModuleStatus, AuditAction } from '../types/index.js';
import { slugify } from '../utils/slug.js';
import { validateModuleDependencies } from '../utils/dependencyGraph.js';

export class AdminModuleService {
  // ==================== MODULE CATEGORIES ====================

  static async getModuleCategories(query: { search?: string; status?: string }) {
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

    const categories = await ModuleCategory.find(filter).sort({ displayOrder: 1, name: 1 });

    // Aggregate module count per module category
    const moduleCounts = await BusinessModule.aggregate([
      { $match: { status: { $ne: ModuleStatus.ARCHIVED } } },
      { $group: { _id: '$moduleCategoryId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    moduleCounts.forEach((mc) => countMap.set(mc._id.toString(), mc.count));

    return categories.map((cat) => {
      const json = cat.toSafeJSON();
      return {
        ...json,
        moduleCount: countMap.get(cat._id.toString()) || 0,
      };
    });
  }

  static async getModuleCategoryById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Module category not found');
      error.statusCode = 404;
      throw error;
    }

    const cat = await ModuleCategory.findById(id);
    if (!cat) {
      const error: any = new Error('Module category not found');
      error.statusCode = 404;
      throw error;
    }

    const moduleCount = await BusinessModule.countDocuments({
      moduleCategoryId: cat._id,
      status: { $ne: ModuleStatus.ARCHIVED },
    });

    return {
      ...cat.toSafeJSON(),
      moduleCount,
    };
  }

  static async createModuleCategory(data: any, adminId: string) {
    const baseSlug = slugify(data.name);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await ModuleCategory.exists({ slug: uniqueSlug })) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    const category = new ModuleCategory({
      name: data.name.trim(),
      slug: uniqueSlug,
      description: data.description ? data.description.trim() : '',
      icon: data.icon ? data.icon.trim() : 'Package',
      status: data.status || CategoryStatus.ACTIVE,
      displayOrder: data.displayOrder ?? 0,
    });

    await category.save();

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.CREATE,
      entityType: 'ModuleCategory',
      entityId: category._id.toString(),
      details: { name: category.name, slug: category.slug },
    });

    return category.toSafeJSON();
  }

  static async updateModuleCategory(id: string, data: any, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Module category not found');
      error.statusCode = 404;
      throw error;
    }

    const category = await ModuleCategory.findById(id);
    if (!category) {
      const error: any = new Error('Module category not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.name && data.name.trim() !== category.name) {
      const baseSlug = slugify(data.name);
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await ModuleCategory.exists({
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
      entityType: 'ModuleCategory',
      entityId: category._id.toString(),
      details: data,
    });

    return category.toSafeJSON();
  }

  static async updateModuleCategoryStatus(id: string, status: CategoryStatus, adminId: string) {
    return this.updateModuleCategory(id, { status }, adminId);
  }

  static async deleteModuleCategory(id: string, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Module category not found');
      error.statusCode = 404;
      throw error;
    }

    const category = await ModuleCategory.findById(id);
    if (!category) {
      const error: any = new Error('Module category not found');
      error.statusCode = 404;
      throw error;
    }

    const linkedModules = await BusinessModule.countDocuments({
      moduleCategoryId: category._id,
      status: { $ne: ModuleStatus.ARCHIVED },
    });

    if (linkedModules > 0) {
      const error: any = new Error(
        `Cannot delete module category because ${linkedModules} active or inactive module(s) are assigned to it. Deactivate the category instead.`
      );
      error.statusCode = 400;
      throw error;
    }

    await ModuleCategory.findByIdAndDelete(id);

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.DELETE,
      entityType: 'ModuleCategory',
      entityId: id,
      details: { name: category.name },
    });

    return { message: 'Module category deleted successfully' };
  }

  // ==================== REUSABLE MODULES ====================

  static async getModules(query: {
    search?: string;
    moduleCategoryId?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status && Object.values(ModuleStatus).includes(query.status as ModuleStatus)) {
      filter.status = query.status;
    }

    if (query.moduleCategoryId && Types.ObjectId.isValid(query.moduleCategoryId)) {
      filter.moduleCategoryId = new Types.ObjectId(query.moduleCategoryId);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.monthlyPrice = {};
      if (query.minPrice !== undefined) filter.monthlyPrice.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) filter.monthlyPrice.$lte = Number(query.maxPrice);
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
    if (query.sortBy === 'price_asc') {
      sortOptions.monthlyPrice = 1;
    } else if (query.sortBy === 'price_desc') {
      sortOptions.monthlyPrice = -1;
    } else if (query.sortBy === 'name') {
      sortOptions.name = 1;
    } else {
      sortOptions.displayOrder = 1;
      sortOptions.createdAt = -1;
    }

    const [totalCount, modules] = await Promise.all([
      BusinessModule.countDocuments(filter),
      BusinessModule.find(filter)
        .populate('moduleCategoryId', 'name slug icon status')
        .populate('dependencies', 'name slug status')
        .populate('recommendedBusinessTypes', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
    ]);

    return {
      modules: modules.map((m) => m.toSafeJSON()),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  static async getModuleById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    const moduleDoc = await BusinessModule.findById(id)
      .populate('moduleCategoryId', 'name slug icon status')
      .populate('dependencies', 'name slug status monthlyPrice yearlyPrice')
      .populate('recommendedBusinessTypes', 'name slug categoryId');

    if (!moduleDoc) {
      const error: any = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    return moduleDoc.toSafeJSON();
  }

  static async createModule(data: any, adminId: string) {
    if (!Types.ObjectId.isValid(data.moduleCategoryId)) {
      const error: any = new Error('Invalid module category ID');
      error.statusCode = 400;
      throw error;
    }

    const moduleCategory = await ModuleCategory.findById(data.moduleCategoryId);
    if (!moduleCategory) {
      const error: any = new Error('Assigned module category not found');
      error.statusCode = 404;
      throw error;
    }

    if (moduleCategory.status !== CategoryStatus.ACTIVE) {
      const error: any = new Error('Cannot assign module to an inactive module category');
      error.statusCode = 400;
      throw error;
    }

    // Validate recommended business types if provided
    const recommendedTypes = Array.isArray(data.recommendedBusinessTypes)
      ? data.recommendedBusinessTypes.filter((id: string) => Types.ObjectId.isValid(id))
      : [];

    if (recommendedTypes.length > 0) {
      const count = await BusinessType.countDocuments({
        _id: { $in: recommendedTypes.map((id: string) => new Types.ObjectId(id)) },
      });
      if (count !== recommendedTypes.length) {
        const error: any = new Error('One or more recommended business types do not exist');
        error.statusCode = 400;
        throw error;
      }
    }

    const baseSlug = slugify(data.name);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await BusinessModule.exists({ slug: uniqueSlug })) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    const proposedDependencies = Array.isArray(data.dependencies)
      ? data.dependencies.filter((id: string) => Types.ObjectId.isValid(id))
      : [];

    const newModuleId = new Types.ObjectId();

    // Validate dependencies and check cycles
    if (proposedDependencies.length > 0) {
      await validateModuleDependencies(newModuleId.toString(), proposedDependencies);
    }

    const moduleDoc = new BusinessModule({
      _id: newModuleId,
      name: data.name.trim(),
      slug: uniqueSlug,
      description: data.description.trim(),
      icon: data.icon ? data.icon.trim() : 'Package',
      moduleCategoryId: moduleCategory._id,
      monthlyPrice: Number(data.monthlyPrice) || 0,
      yearlyPrice: Number(data.yearlyPrice) || 0,
      currency: data.currency ? data.currency.trim().toUpperCase() : 'USD',
      status: data.status || ModuleStatus.ACTIVE,
      dependencies: proposedDependencies.map((id: string) => new Types.ObjectId(id)),
      recommendedBusinessTypes: recommendedTypes.map((id: string) => new Types.ObjectId(id)),
      displayOrder: Number(data.displayOrder) || 0,
    });

    await moduleDoc.save();

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.CREATE,
      entityType: 'BusinessModule',
      entityId: moduleDoc._id.toString(),
      details: {
        name: moduleDoc.name,
        monthlyPrice: moduleDoc.monthlyPrice,
        yearlyPrice: moduleDoc.yearlyPrice,
      },
    });

    await moduleDoc.populate([
      { path: 'moduleCategoryId', select: 'name slug icon status' },
      { path: 'dependencies', select: 'name slug status' },
      { path: 'recommendedBusinessTypes', select: 'name slug' },
    ]);

    return moduleDoc.toSafeJSON();
  }

  static async updateModule(id: string, data: any, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    const moduleDoc = await BusinessModule.findById(id);
    if (!moduleDoc) {
      const error: any = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.moduleCategoryId && data.moduleCategoryId.toString() !== moduleDoc.moduleCategoryId.toString()) {
      if (!Types.ObjectId.isValid(data.moduleCategoryId)) {
        const error: any = new Error('Invalid module category ID');
        error.statusCode = 400;
        throw error;
      }
      const category = await ModuleCategory.findById(data.moduleCategoryId);
      if (!category) {
        const error: any = new Error('Target module category not found');
        error.statusCode = 404;
        throw error;
      }
      if (category.status !== CategoryStatus.ACTIVE) {
        const error: any = new Error('Cannot assign module to an inactive module category');
        error.statusCode = 400;
        throw error;
      }
      moduleDoc.moduleCategoryId = category._id;
    }

    if (data.name && data.name.trim() !== moduleDoc.name) {
      const baseSlug = slugify(data.name);
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await BusinessModule.exists({
          slug: uniqueSlug,
          _id: { $ne: moduleDoc._id },
        })
      ) {
        counter++;
        uniqueSlug = `${baseSlug}-${counter}`;
      }
      moduleDoc.name = data.name.trim();
      moduleDoc.slug = uniqueSlug;
    }

    if (data.description !== undefined) moduleDoc.description = data.description.trim();
    if (data.icon !== undefined) moduleDoc.icon = data.icon.trim();
    if (data.monthlyPrice !== undefined) moduleDoc.monthlyPrice = Math.max(0, Number(data.monthlyPrice));
    if (data.yearlyPrice !== undefined) moduleDoc.yearlyPrice = Math.max(0, Number(data.yearlyPrice));
    if (data.currency !== undefined) moduleDoc.currency = data.currency.trim().toUpperCase();
    if (data.status !== undefined) moduleDoc.status = data.status;
    if (data.displayOrder !== undefined) moduleDoc.displayOrder = Number(data.displayOrder);

    // Dependencies check
    if (data.dependencies !== undefined && Array.isArray(data.dependencies)) {
      await validateModuleDependencies(id, data.dependencies);
      moduleDoc.dependencies = data.dependencies.map((depId: string) => new Types.ObjectId(depId));
    }

    // Recommendations check
    if (data.recommendedBusinessTypes !== undefined && Array.isArray(data.recommendedBusinessTypes)) {
      if (data.recommendedBusinessTypes.length > 0) {
        const validIds = data.recommendedBusinessTypes.filter((btId: string) => Types.ObjectId.isValid(btId));
        const count = await BusinessType.countDocuments({
          _id: { $in: validIds.map((btId: string) => new Types.ObjectId(btId)) },
        });
        if (count !== validIds.length) {
          const error: any = new Error('One or more recommended business types do not exist');
          error.statusCode = 400;
          throw error;
        }
        moduleDoc.recommendedBusinessTypes = validIds.map((btId: string) => new Types.ObjectId(btId));
      } else {
        moduleDoc.recommendedBusinessTypes = [];
      }
    }

    await moduleDoc.save();

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.UPDATE,
      entityType: 'BusinessModule',
      entityId: moduleDoc._id.toString(),
      details: data,
    });

    await moduleDoc.populate([
      { path: 'moduleCategoryId', select: 'name slug icon status' },
      { path: 'dependencies', select: 'name slug status' },
      { path: 'recommendedBusinessTypes', select: 'name slug' },
    ]);

    return moduleDoc.toSafeJSON();
  }

  static async updateModuleStatus(id: string, status: ModuleStatus, adminId: string) {
    return this.updateModule(id, { status }, adminId);
  }

  static async updateModuleDependencies(id: string, dependencies: string[], adminId: string) {
    return this.updateModule(id, { dependencies }, adminId);
  }

  static async updateModuleRecommendations(id: string, recommendedBusinessTypes: string[], adminId: string) {
    return this.updateModule(id, { recommendedBusinessTypes }, adminId);
  }

  static async deleteModule(id: string, adminId: string) {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    const moduleDoc = await BusinessModule.findById(id);
    if (!moduleDoc) {
      const error: any = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    // Safety check: Cannot delete if other modules depend on this module
    const dependents = await BusinessModule.find({
      dependencies: moduleDoc._id,
      status: { $ne: ModuleStatus.ARCHIVED },
    });

    if (dependents.length > 0) {
      const dependentNames = dependents.map((d) => d.name).join(', ');
      const error: any = new Error(
        `Cannot delete module "${moduleDoc.name}" because other active module(s) depend on it: ${dependentNames}. Remove these dependencies or archive the module instead.`
      );
      error.statusCode = 400;
      throw error;
    }

    await BusinessModule.findByIdAndDelete(id);

    await AuditLog.create({
      adminId: new Types.ObjectId(adminId),
      action: AuditAction.DELETE,
      entityType: 'BusinessModule',
      entityId: id,
      details: { name: moduleDoc.name },
    });

    return { message: 'Module deleted successfully' };
  }
}
