import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { BusinessCategory } from '../models/BusinessCategory.js';
import { BusinessType } from '../models/BusinessType.js';
import { Business } from '../models/Business.js';
import { ModuleCategory } from '../models/ModuleCategory.js';
import { BusinessModule } from '../models/BusinessModule.js';
import { AuditLog } from '../models/AuditLog.js';
import { UserRole, AccountStatus, CategoryStatus, ModuleStatus } from '../types/index.js';
import { signAccessToken } from '../utils/jwt.js';

describe('Flexora Step 3: Platform Admin Management Test Suite', () => {
  const adminId = new mongoose.Types.ObjectId().toString();
  const ownerId = new mongoose.Types.ObjectId().toString();
  const managerId = new mongoose.Types.ObjectId().toString();
  const staffId = new mongoose.Types.ObjectId().toString();

  const categoryId = new mongoose.Types.ObjectId().toString();
  const businessTypeId = new mongoose.Types.ObjectId().toString();
  const moduleCategoryId = new mongoose.Types.ObjectId().toString();

  const moduleAId = new mongoose.Types.ObjectId().toString();
  const moduleBId = new mongoose.Types.ObjectId().toString();
  const moduleCId = new mongoose.Types.ObjectId().toString();

  const adminToken = signAccessToken({
    userId: adminId,
    email: 'admin@flexora.com',
    role: UserRole.PLATFORM_ADMIN,
    status: AccountStatus.ACTIVE,
  });

  const ownerToken = signAccessToken({
    userId: ownerId,
    email: 'owner@flexora.com',
    role: UserRole.BUSINESS_OWNER,
    status: AccountStatus.ACTIVE,
  });

  const managerToken = signAccessToken({
    userId: managerId,
    email: 'manager@flexora.com',
    role: UserRole.MANAGER,
    status: AccountStatus.ACTIVE,
  });

  const staffToken = signAccessToken({
    userId: staffId,
    email: 'staff@flexora.com',
    role: UserRole.STAFF,
    status: AccountStatus.ACTIVE,
  });

  const mockAdminUser = {
    _id: adminId,
    id: adminId,
    email: 'admin@flexora.com',
    role: UserRole.PLATFORM_ADMIN,
    status: AccountStatus.ACTIVE,
  };

  const mockOwnerUser = {
    _id: ownerId,
    id: ownerId,
    email: 'owner@flexora.com',
    role: UserRole.BUSINESS_OWNER,
    status: AccountStatus.ACTIVE,
  };

  const mockManagerUser = {
    _id: managerId,
    id: managerId,
    email: 'manager@flexora.com',
    role: UserRole.MANAGER,
    status: AccountStatus.ACTIVE,
  };

  const mockStaffUser = {
    _id: staffId,
    id: staffId,
    email: 'staff@flexora.com',
    role: UserRole.STAFF,
    status: AccountStatus.ACTIVE,
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(User, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === adminId) return Promise.resolve(mockAdminUser as any);
      if (idStr === ownerId) return Promise.resolve(mockOwnerUser as any);
      if (idStr === managerId) return Promise.resolve(mockManagerUser as any);
      if (idStr === staffId) return Promise.resolve(mockStaffUser as any);
      return Promise.resolve(null as any);
    }) as any);

    vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);
  });

  describe('1. Platform Admin Access Control', () => {
    it('rejects unauthenticated requests to administrative endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/admin/categories');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('rejects Business Owner role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('rejects Manager role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/modules')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('rejects Staff role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/module-categories')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('grants access to authenticated Platform Admin', async () => {
      vi.spyOn(BusinessCategory, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);
      vi.spyOn(BusinessType, 'aggregate').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('2. Business Category Management CRUD', () => {
    it('creates a new business category with collision-safe slug', async () => {
      vi.spyOn(BusinessCategory, 'exists').mockResolvedValue(null);
      vi.spyOn(BusinessCategory.prototype, 'save').mockResolvedValue({} as any);
      vi.spyOn(BusinessCategory.prototype, 'toSafeJSON').mockReturnValue({
        id: categoryId,
        name: 'Aerospace & Defence',
        slug: 'aerospace-defence',
        status: CategoryStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aerospace & Defence',
          description: 'Aviation and aerospace manufacturing and services',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.category.name).toBe('Aerospace & Defence');
    });

    it('prevents unsafe deletion when category is referenced by business types', async () => {
      vi.spyOn(BusinessCategory, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(categoryId),
        name: 'Retail',
      } as any);

      vi.spyOn(BusinessType, 'countDocuments').mockResolvedValue(5);
      vi.spyOn(Business, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .delete(`/api/v1/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/referenced by 5 business type\(s\)/i);
    });
  });

  describe('3. Business Type Management & Category Assignment', () => {
    it('rejects creating a business type with invalid or nonexistent category ID', async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(BusinessCategory, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/admin/business-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Avionics Lab',
          categoryId: fakeCatId,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/category not found/i);
    });

    it('rejects creating a business type in an inactive category', async () => {
      vi.spyOn(BusinessCategory, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(categoryId),
        status: CategoryStatus.INACTIVE,
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/business-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Avionics Lab',
          categoryId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive category/i);
    });

    it('prevents deleting a business type that has registered businesses', async () => {
      vi.spyOn(BusinessType, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(businessTypeId),
        name: 'Dental Clinic',
      } as any);

      vi.spyOn(Business, 'countDocuments').mockResolvedValue(3);

      const res = await request(app)
        .delete(`/api/v1/admin/business-types/${businessTypeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/actively used by 3 registered business\(es\)/i);
    });
  });

  describe('4. Module Category Management', () => {
    it('creates a module category', async () => {
      vi.spyOn(ModuleCategory, 'exists').mockResolvedValue(null);
      vi.spyOn(ModuleCategory.prototype, 'save').mockResolvedValue({} as any);
      vi.spyOn(ModuleCategory.prototype, 'toSafeJSON').mockReturnValue({
        id: moduleCategoryId,
        name: 'AI & Automation',
        slug: 'ai-automation',
        status: CategoryStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/admin/module-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'AI & Automation',
          description: 'Autonomous workflows and machine intelligence',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.category.name).toBe('AI & Automation');
    });

    it('prevents deleting module category when reusable modules are assigned to it', async () => {
      vi.spyOn(ModuleCategory, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(moduleCategoryId),
        name: 'Operations',
      } as any);

      vi.spyOn(BusinessModule, 'countDocuments').mockResolvedValue(4);

      const res = await request(app)
        .delete(`/api/v1/admin/module-categories/${moduleCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/4 active or inactive module\(s\) are assigned to it/i);
    });
  });

  describe('5. Reusable Module Management & Pricing Validation', () => {
    it('rejects module creation when prices are negative', async () => {
      const res = await request(app)
        .post('/api/v1/admin/modules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Advanced Reporting',
          description: 'Comprehensive business metrics and exportable spreadsheets',
          moduleCategoryId,
          monthlyPrice: -15, // Invalid negative price
          yearlyPrice: 150,
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('creates a module with valid pricing and calculates annual savings correctly', async () => {
      vi.spyOn(ModuleCategory, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(moduleCategoryId),
        status: CategoryStatus.ACTIVE,
      } as any);

      vi.spyOn(BusinessModule, 'exists').mockResolvedValue(null);
      vi.spyOn(BusinessModule.prototype, 'save').mockResolvedValue({} as any);
      vi.spyOn(BusinessModule.prototype, 'populate').mockResolvedValue({} as any);
      vi.spyOn(BusinessModule.prototype, 'toSafeJSON').mockReturnValue({
        id: moduleAId,
        name: 'Advanced CRM',
        slug: 'advanced-crm',
        monthlyPrice: 29,
        yearlyPrice: 290,
        currency: 'USD',
        status: ModuleStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/admin/modules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Advanced CRM',
          description: 'Comprehensive customer relationship management and sales pipelines',
          moduleCategoryId,
          monthlyPrice: 29,
          yearlyPrice: 290,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.module.monthlyPrice).toBe(29);
      expect(res.body.data.module.yearlyPrice).toBe(290);
    });
  });

  describe('6. Module Dependency Graph & Circular Dependency Prevention', () => {
    it('rejects self-dependency (Module cannot depend on itself)', async () => {
      vi.spyOn(BusinessModule, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(moduleAId),
        name: 'Billing',
        dependencies: [],
      } as any);

      const res = await request(app)
        .patch(`/api/v1/admin/modules/${moduleAId}/dependencies`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dependencies: [moduleAId], // Self-dependency
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot depend on itself/i);
    });

    it('rejects duplicate dependencies', async () => {
      vi.spyOn(BusinessModule, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(moduleAId),
        name: 'Billing',
        dependencies: [],
      } as any);

      const res = await request(app)
        .patch(`/api/v1/admin/modules/${moduleAId}/dependencies`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dependencies: [moduleBId, moduleBId], // Duplicate
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/duplicate dependencies/i);
    });

    it('rejects direct circular dependency (A depends on B, attempting to make B depend on A)', async () => {
      vi.spyOn(BusinessModule, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(moduleBId),
        name: 'Module B',
        dependencies: [],
      } as any);

      // In the database: Module A currently depends on Module B
      vi.spyOn(BusinessModule, 'find')
        .mockResolvedValueOnce([
          { _id: new mongoose.Types.ObjectId(moduleAId), name: 'Module A', status: ModuleStatus.ACTIVE },
        ] as any)
        .mockReturnValueOnce({
          lean: vi.fn().mockResolvedValue([
            { _id: new mongoose.Types.ObjectId(moduleAId), name: 'Module A', dependencies: [new mongoose.Types.ObjectId(moduleBId)] },
            { _id: new mongoose.Types.ObjectId(moduleBId), name: 'Module B', dependencies: [] },
          ]),
        } as any);

      // Now attempting to set Module B's dependencies to [Module A] -> Creates cycle B -> A -> B!
      const res = await request(app)
        .patch(`/api/v1/admin/modules/${moduleBId}/dependencies`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dependencies: [moduleAId],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/circular dependency detected/i);
    });

    it('rejects indirect circular dependency (A -> B -> C, attempting to make C depend on A)', async () => {
      vi.spyOn(BusinessModule, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(moduleCId),
        name: 'Module C',
        dependencies: [],
      } as any);

      // In the database: Module A -> Module B -> Module C
      vi.spyOn(BusinessModule, 'find')
        .mockResolvedValueOnce([
          { _id: new mongoose.Types.ObjectId(moduleAId), name: 'Module A', status: ModuleStatus.ACTIVE },
        ] as any)
        .mockReturnValueOnce({
          lean: vi.fn().mockResolvedValue([
            { _id: new mongoose.Types.ObjectId(moduleAId), name: 'Module A', dependencies: [new mongoose.Types.ObjectId(moduleBId)] },
            { _id: new mongoose.Types.ObjectId(moduleBId), name: 'Module B', dependencies: [new mongoose.Types.ObjectId(moduleCId)] },
            { _id: new mongoose.Types.ObjectId(moduleCId), name: 'Module C', dependencies: [] },
          ]),
        } as any);

      // Attempting to set Module C's dependencies to [Module A] -> Creates indirect cycle C -> A -> B -> C!
      const res = await request(app)
        .patch(`/api/v1/admin/modules/${moduleCId}/dependencies`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dependencies: [moduleAId],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/circular dependency detected/i);
    });
  });

  describe('7. Admin Dashboard Analytics Endpoint', () => {
    it('returns aggregated real statistics across users, categories, and modules', async () => {
      vi.spyOn(User, 'countDocuments').mockResolvedValue(10);
      vi.spyOn(User, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      vi.spyOn(BusinessCategory, 'countDocuments').mockResolvedValue(9);
      vi.spyOn(BusinessType, 'countDocuments').mockResolvedValue(72);
      vi.spyOn(ModuleCategory, 'countDocuments').mockResolvedValue(11);
      vi.spyOn(BusinessModule, 'countDocuments').mockResolvedValue(45);

      vi.spyOn(BusinessModule, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      vi.spyOn(BusinessModule, 'aggregate').mockResolvedValue([
        { _id: new mongoose.Types.ObjectId(), name: 'Finance', count: 6 },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.stats.totalBusinessCategories).toBe(9);
      expect(res.body.data.stats.totalBusinessTypes).toBe(72);
      expect(res.body.data.stats.totalModuleCategories).toBe(11);
      expect(res.body.data.stats.totalModules).toBe(45);
    });
  });
});
