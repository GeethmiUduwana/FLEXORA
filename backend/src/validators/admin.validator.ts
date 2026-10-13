import { z } from 'zod';
import { CategoryStatus, ModuleStatus } from '../types/index.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB identifier');

// Business Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export const updateCategoryStatusSchema = z.object({
  status: z.nativeEnum(CategoryStatus),
});

// Business Type Schemas
export const createBusinessTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  categoryId: objectIdSchema,
  description: z.string().max(500).optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
  isCustom: z.boolean().optional(),
});

export const updateBusinessTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  categoryId: objectIdSchema.optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
  isCustom: z.boolean().optional(),
});

// Module Category Schemas
export const createModuleCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export const updateModuleCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
  displayOrder: z.coerce.number().int().optional(),
});

// Module Schemas
export const createModuleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000),
  icon: z.string().max(50).optional(),
  moduleCategoryId: objectIdSchema,
  monthlyPrice: z.coerce.number().min(0, 'Monthly price cannot be negative'),
  yearlyPrice: z.coerce.number().min(0, 'Yearly price cannot be negative'),
  currency: z.string().length(3).optional().default('USD'),
  status: z.nativeEnum(ModuleStatus).optional(),
  dependencies: z.array(objectIdSchema).optional().default([]),
  recommendedBusinessTypes: z.array(objectIdSchema).optional().default([]),
  displayOrder: z.coerce.number().int().optional(),
});

export const updateModuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(5).max(1000).optional(),
  icon: z.string().max(50).optional(),
  moduleCategoryId: objectIdSchema.optional(),
  monthlyPrice: z.coerce.number().min(0, 'Monthly price cannot be negative').optional(),
  yearlyPrice: z.coerce.number().min(0, 'Yearly price cannot be negative').optional(),
  currency: z.string().length(3).optional(),
  status: z.nativeEnum(ModuleStatus).optional(),
  dependencies: z.array(objectIdSchema).optional(),
  recommendedBusinessTypes: z.array(objectIdSchema).optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export const updateModuleStatusSchema = z.object({
  status: z.nativeEnum(ModuleStatus),
});

export const updateDependenciesSchema = z.object({
  dependencies: z.array(objectIdSchema),
});

export const updateRecommendationsSchema = z.object({
  recommendedBusinessTypes: z.array(objectIdSchema),
});
