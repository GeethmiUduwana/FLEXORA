import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { BusinessCategory } from '../models/BusinessCategory.js';
import { BusinessType } from '../models/BusinessType.js';
import { Business } from '../models/Business.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { UserRole, AccountStatus, CategoryStatus, BusinessStatus } from '../types/index.js';
import { signAccessToken } from '../utils/jwt.js';

describe('Flexora Step 2: Business Registration & Multi-Tenant Management Test Suite', () => {
  const ownerId = new mongoose.Types.ObjectId().toString();
  const otherOwnerId = new mongoose.Types.ObjectId().toString();
  const managerId = new mongoose.Types.ObjectId().toString();
  const staffId = new mongoose.Types.ObjectId().toString();

  const categoryId = new mongoose.Types.ObjectId().toString();
  const otherCategoryId = new mongoose.Types.ObjectId().toString();
  const businessTypeId = new mongoose.Types.ObjectId().toString();
  const inactiveTypeId = new mongoose.Types.ObjectId().toString();
  const otherCategoryTypeId = new mongoose.Types.ObjectId().toString();

  const ownerToken = signAccessToken({ userId: ownerId, email: 'owner@flexora.com', role: UserRole.BUSINESS_OWNER, status: AccountStatus.ACTIVE });
  const otherOwnerToken = signAccessToken({ userId: otherOwnerId, email: 'otherowner@flexora.com', role: UserRole.BUSINESS_OWNER, status: AccountStatus.ACTIVE });
  const managerToken = signAccessToken({ userId: managerId, email: 'manager@flexora.com', role: UserRole.MANAGER, status: AccountStatus.ACTIVE });
  const staffToken = signAccessToken({ userId: staffId, email: 'staff@flexora.com', role: UserRole.STAFF, status: AccountStatus.ACTIVE });

  const mockOwnerUser = {
    _id: ownerId,
    id: ownerId,
    email: 'owner@flexora.com',
    role: UserRole.BUSINESS_OWNER,
    status: AccountStatus.ACTIVE,
  };

  const mockOtherOwner = {
    _id: otherOwnerId,
    id: otherOwnerId,
    email: 'otherowner@flexora.com',
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

  const mockActiveCategory = {
    _id: new mongoose.Types.ObjectId(categoryId),
    id: categoryId,
    name: 'Professional Services',
    slug: 'professional-services',
    status: CategoryStatus.ACTIVE,
    displayOrder: 1,
    toSafeJSON() {
      return {
        id: categoryId,
        name: 'Professional Services',
        slug: 'professional-services',
        status: CategoryStatus.ACTIVE,
      };
    },
  };

  const mockActiveType = {
    _id: new mongoose.Types.ObjectId(businessTypeId),
    id: businessTypeId,
    categoryId: new mongoose.Types.ObjectId(categoryId),
    name: 'Software Company',
    slug: 'software-company',
    status: CategoryStatus.ACTIVE,
    isCustom: false,
    toSafeJSON() {
      return {
        id: businessTypeId,
        categoryId,
        name: 'Software Company',
        slug: 'software-company',
        status: CategoryStatus.ACTIVE,
      };
    },
  };

  const mockOtherCategoryType = {
    _id: new mongoose.Types.ObjectId(otherCategoryTypeId),
    id: otherCategoryTypeId,
    categoryId: new mongoose.Types.ObjectId(otherCategoryId),
    name: 'Hotel',
    slug: 'hotel',
    status: CategoryStatus.ACTIVE,
    isCustom: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock for User.findById
    vi.spyOn(User, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === ownerId) return Promise.resolve(mockOwnerUser as any);
      if (idStr === otherOwnerId) return Promise.resolve(mockOtherOwner as any);
      if (idStr === managerId) return Promise.resolve(mockManagerUser as any);
      if (idStr === staffId) return Promise.resolve(mockStaffUser as any);
      return Promise.resolve(null as any);
    }) as any);

    // Default mock for BusinessMembership.findOneAndUpdate
    vi.spyOn(BusinessMembership, 'findOneAndUpdate').mockResolvedValue({} as any);
  });

  describe('1. Business Categories & Types API', () => {
    it('returns active business categories', async () => {
      vi.spyOn(BusinessCategory, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockActiveCategory]),
      } as any);

      const res = await request(app).get('/api/v1/business-categories');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.categories).toHaveLength(1);
      expect(res.body.data.categories[0].name).toBe('Professional Services');
    });

    it('returns active business types for a valid category', async () => {
      vi.spyOn(BusinessCategory, 'findOne').mockResolvedValue(mockActiveCategory as any);
      vi.spyOn(BusinessType, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockActiveType]),
      } as any);

      const res = await request(app).get(`/api/v1/business-categories/${categoryId}/types`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.types).toHaveLength(1);
      expect(res.body.data.types[0].name).toBe('Software Company');
    });

    it('returns 404 when querying business types for a non-existent category', async () => {
      vi.spyOn(BusinessCategory, 'findOne').mockResolvedValue(null);

      const res = await request(app).get(`/api/v1/business-categories/${categoryId}/types`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });
  });

  describe('2. Business Creation Access Control & Multi-Tenancy', () => {
    it('rejects unauthenticated requests to create a business with 401', async () => {
      const res = await request(app)
        .post('/api/v1/businesses')
        .send({
          name: 'Acme Solutions',
          categoryId,
          businessTypeId,
          description: 'A cutting-edge tech consultancy',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('rejects Manager role from creating businesses with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Acme Solutions',
          categoryId,
          businessTypeId,
          description: 'A cutting-edge tech consultancy',
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('rejects Staff role from creating businesses with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Acme Solutions',
          categoryId,
          businessTypeId,
          description: 'A cutting-edge tech consultancy',
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('allows an authenticated BUSINESS_OWNER to create a valid business and enforces server-side ownerId', async () => {
      vi.spyOn(BusinessCategory, 'findOne').mockResolvedValue(mockActiveCategory as any);
      vi.spyOn(BusinessType, 'findOne').mockResolvedValue(mockActiveType as any);
      vi.spyOn(Business, 'exists').mockResolvedValue(null as any);

      vi.spyOn(Business.prototype, 'save').mockResolvedValue({} as any);
      vi.spyOn(Business.prototype, 'populate').mockResolvedValue({} as any);
      vi.spyOn(Business.prototype, 'toSafeJSON').mockReturnValue({
        id: '607f1f77bcf86cd799439099',
        name: 'Acme Solutions',
        slug: 'acme-solutions',
        ownerId: ownerId, // Server enforces authenticated user ID
        categoryId,
        businessTypeId,
        description: 'A cutting-edge tech consultancy',
        status: BusinessStatus.ACTIVE,
      });

      // Attempt spoofing ownerId in request body
      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Acme Solutions',
          categoryId,
          businessTypeId,
          description: 'A cutting-edge tech consultancy',
          ownerId: otherOwnerId, // Spoofed ownerId must be ignored!
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.business.name).toBe('Acme Solutions');
      expect(res.body.data.business.ownerId).toBe(ownerId);
    });
  });

  describe('3. Business Validation Rules', () => {
    it('rejects registration with missing required fields (name, description, category)', async () => {
      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: '',
          description: 'Short',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.errors).toBeDefined();
    });

    it('rejects registration when category ID is invalid or inactive', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(BusinessCategory, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Acme Solutions',
          categoryId: fakeId,
          businessTypeId,
          description: 'A cutting-edge tech consultancy with long description',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/category not found or is currently inactive/i);
    });

    it('rejects registration when business type belongs to another category', async () => {
      vi.spyOn(BusinessCategory, 'findOne').mockResolvedValue(mockActiveCategory as any);
      vi.spyOn(BusinessType, 'findOne').mockResolvedValue(mockOtherCategoryType as any);

      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Acme Solutions',
          categoryId,
          businessTypeId: otherCategoryTypeId,
          description: 'A cutting-edge tech consultancy with long description',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/selected business type does not belong to the selected category/i);
    });

    it('allows Custom Business Type registration when businessTypeId is omitted and custom type text provided', async () => {
      vi.spyOn(BusinessCategory, 'findOne').mockResolvedValue(mockActiveCategory as any);
      vi.spyOn(Business, 'exists').mockResolvedValue(null as any);

      vi.spyOn(Business.prototype, 'save').mockResolvedValue({} as any);
      vi.spyOn(Business.prototype, 'populate').mockResolvedValue({} as any);
      vi.spyOn(Business.prototype, 'toSafeJSON').mockReturnValue({
        id: '607f1f77bcf86cd799439088',
        name: 'Bespoke AI Studio',
        slug: 'bespoke-ai-studio',
        customBusinessType: 'Autonomous Drone Diagnostics',
        ownerId,
        status: BusinessStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Bespoke AI Studio',
          categoryId,
          customBusinessType: 'Autonomous Drone Diagnostics',
          description: 'Specialized enterprise robotics diagnostics',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.business.customBusinessType).toBe('Autonomous Drone Diagnostics');
    });

    it('handles duplicate business slug safely by appending counter suffix', async () => {
      vi.spyOn(BusinessCategory, 'findOne').mockResolvedValue(mockActiveCategory as any);
      vi.spyOn(BusinessType, 'findOne').mockResolvedValue(mockActiveType as any);

      // First exists returns true (collision), second returns null
      vi.spyOn(Business, 'exists')
        .mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() } as any)
        .mockResolvedValueOnce(null as any);

      let savedSlug = '';
      vi.spyOn(Business.prototype, 'save').mockImplementation(function (this: any) {
        savedSlug = this.slug;
        return Promise.resolve(this);
      });
      vi.spyOn(Business.prototype, 'populate').mockResolvedValue({} as any);
      vi.spyOn(Business.prototype, 'toSafeJSON').mockImplementation(function (this: any) {
        return {
          id: '607f1f77bcf86cd799439099',
          name: this.name,
          slug: savedSlug,
          ownerId,
        };
      });

      const res = await request(app)
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Acme Solutions',
          categoryId,
          businessTypeId,
          description: 'Another branch with the exact same name',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.business.slug).toBe('acme-solutions-2');
    });
  });

  describe('4. Multi-Tenant Business Isolation & Profile Management', () => {
    const businessAId = new mongoose.Types.ObjectId().toString();

    const mockBusinessA = {
      _id: new mongoose.Types.ObjectId(businessAId),
      id: businessAId,
      name: 'Owner A Business',
      slug: 'owner-a-business',
      ownerId: new mongoose.Types.ObjectId(ownerId),
      description: 'Owned exclusively by Owner A',
      status: BusinessStatus.ACTIVE,
      employeeCount: 3,
      customerCount: 15,
      save: vi.fn().mockResolvedValue(true),
      populate: vi.fn().mockResolvedValue(true),
      toSafeJSON() {
        return {
          id: businessAId,
          name: this.name,
          slug: this.slug,
          ownerId: ownerId,
          description: this.description,
          status: this.status,
          employeeCount: this.employeeCount,
          customerCount: this.customerCount,
        };
      },
    };

    it('allows Business Owner to retrieve their owned businesses via GET /businesses/my', async () => {
      vi.spyOn(Business, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([mockBusinessA]),
        }),
      } as any);

      const res = await request(app)
        .get('/api/v1/businesses/my')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.businesses).toHaveLength(1);
      expect(res.body.data.businesses[0].name).toBe('Owner A Business');
    });

    it('allows Business Owner to retrieve their specific business by ID', async () => {
      vi.spyOn(Business, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBusinessA),
      } as any);

      const res = await request(app)
        .get(`/api/v1/businesses/${businessAId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.business.id).toBe(businessAId);
    });

    it('rejects another Business Owner from retrieving business they do not own (returns 404 to avoid leaking existence)', async () => {
      vi.spyOn(Business, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBusinessA),
      } as any);

      // Owner B attempts to view Owner A's business
      const res = await request(app)
        .get(`/api/v1/businesses/${businessAId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/business not found/i);
    });

    it('allows Business Owner to update their own business profile', async () => {
      const updatableBusiness = {
        ...mockBusinessA,
        description: 'Original description',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
        toSafeJSON() {
          return {
            id: businessAId,
            name: this.name,
            description: this.description,
            ownerId,
          };
        },
      };

      vi.spyOn(Business, 'findById').mockResolvedValue(updatableBusiness as any);

      const res = await request(app)
        .patch(`/api/v1/businesses/${businessAId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          description: 'Updated profile description with high detail',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.business.description).toBe('Updated profile description with high detail');
    });

    it('prevents another Business Owner from updating a business they do not own (403 Forbidden)', async () => {
      vi.spyOn(Business, 'findById').mockResolvedValue(mockBusinessA as any);

      // Owner B attempts to edit Owner A's business
      const res = await request(app)
        .patch(`/api/v1/businesses/${businessAId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({
          name: 'Hijacked Name',
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('ignores attempts to alter protected fields (ownerId, status) in PATCH request', async () => {
      const updatableBusiness = {
        ...mockBusinessA,
        ownerId: new mongoose.Types.ObjectId(ownerId),
        status: BusinessStatus.ACTIVE,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
        toSafeJSON() {
          return { id: businessAId, ownerId, status: this.status };
        },
      };

      vi.spyOn(Business, 'findById').mockResolvedValue(updatableBusiness as any);

      const res = await request(app)
        .patch(`/api/v1/businesses/${businessAId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ownerId: otherOwnerId, // Protected: must not change!
          status: BusinessStatus.SUSPENDED, // Protected: must not change!
        });

      expect(res.status).toBe(200);
      expect(res.body.data.business.ownerId).toBe(ownerId);
      expect(res.body.data.business.status).toBe(BusinessStatus.ACTIVE);
    });
  });
});
