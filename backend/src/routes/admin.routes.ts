import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { AdminCategoryController } from '../controllers/adminCategory.controller.js';
import { AdminModuleController } from '../controllers/adminModule.controller.js';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateStatusSchema, updateRoleSchema } from '../validators/auth.validator.js';
import {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
  createBusinessTypeSchema,
  updateBusinessTypeSchema,
  createModuleCategorySchema,
  updateModuleCategorySchema,
  createModuleSchema,
  updateModuleSchema,
  updateModuleStatusSchema,
  updateDependenciesSchema,
  updateRecommendationsSchema,
} from '../validators/admin.validator.js';

const router = Router();

// Protect all admin endpoints with authentication AND Platform Admin authorization
router.use(requireAuth, requirePlatformAdmin);

// ==================== DASHBOARD & USER MANAGEMENT ====================
router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/status', validateBody(updateStatusSchema), AdminController.updateStatus);
router.patch('/users/:id/role', validateBody(updateRoleSchema), AdminController.updateRole);

// ==================== BUSINESS CATEGORIES ====================
router.get('/categories', AdminCategoryController.getCategories);
router.post('/categories', validateBody(createCategorySchema), AdminCategoryController.createCategory);
router.get('/categories/:id', AdminCategoryController.getCategoryById);
router.patch('/categories/:id', validateBody(updateCategorySchema), AdminCategoryController.updateCategory);
router.patch('/categories/:id/status', validateBody(updateCategoryStatusSchema), AdminCategoryController.updateCategoryStatus);
router.delete('/categories/:id', AdminCategoryController.deleteCategory);

// ==================== BUSINESS TYPES ====================
router.get('/business-types', AdminCategoryController.getBusinessTypes);
router.post('/business-types', validateBody(createBusinessTypeSchema), AdminCategoryController.createBusinessType);
router.get('/business-types/:id', AdminCategoryController.getBusinessTypeById);
router.patch('/business-types/:id', validateBody(updateBusinessTypeSchema), AdminCategoryController.updateBusinessType);
router.patch('/business-types/:id/status', validateBody(updateCategoryStatusSchema), AdminCategoryController.updateBusinessTypeStatus);
router.delete('/business-types/:id', AdminCategoryController.deleteBusinessType);

// ==================== MODULE CATEGORIES ====================
router.get('/module-categories', AdminModuleController.getModuleCategories);
router.post('/module-categories', validateBody(createModuleCategorySchema), AdminModuleController.createModuleCategory);
router.get('/module-categories/:id', AdminModuleController.getModuleCategoryById);
router.patch('/module-categories/:id', validateBody(updateModuleCategorySchema), AdminModuleController.updateModuleCategory);
router.patch('/module-categories/:id/status', validateBody(updateCategoryStatusSchema), AdminModuleController.updateModuleCategoryStatus);
router.delete('/module-categories/:id', AdminModuleController.deleteModuleCategory);

// ==================== REUSABLE MODULES ====================
router.get('/modules', AdminModuleController.getModules);
router.post('/modules', validateBody(createModuleSchema), AdminModuleController.createModule);
router.get('/modules/:id', AdminModuleController.getModuleById);
router.patch('/modules/:id', validateBody(updateModuleSchema), AdminModuleController.updateModule);
router.patch('/modules/:id/status', validateBody(updateModuleStatusSchema), AdminModuleController.updateModuleStatus);
router.patch('/modules/:id/dependencies', validateBody(updateDependenciesSchema), AdminModuleController.updateModuleDependencies);
router.patch('/modules/:id/recommendations', validateBody(updateRecommendationsSchema), AdminModuleController.updateModuleRecommendations);
router.delete('/modules/:id', AdminModuleController.deleteModule);

export default router;
