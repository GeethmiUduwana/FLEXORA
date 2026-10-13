import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { UserRole, AccountStatus } from '../types/index.js';
import bcrypt from 'bcryptjs';
import { signAccessToken } from '../utils/jwt.js';

describe('Flexora Auth & RBAC API Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Registration & Security', () => {
    it('successfully registers a new user with BUSINESS_OWNER role only', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null as any);
      const mockSavedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'newowner@flexora.com',
        firstName: 'Alex',
        lastName: 'Morgan',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        toSafeJSON() {
          return {
            id: '507f1f77bcf86cd799439011',
            email: 'newowner@flexora.com',
            firstName: 'Alex',
            lastName: 'Morgan',
            role: UserRole.BUSINESS_OWNER,
            status: AccountStatus.ACTIVE,
            isEmailVerified: true,
          };
        },
      };

      vi.spyOn(User.prototype, 'save').mockResolvedValue(mockSavedUser as any);
      vi.spyOn(BusinessMembership, 'create').mockResolvedValue({} as any);
      vi.spyOn(RefreshSession, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newowner@flexora.com',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          firstName: 'Alex',
          lastName: 'Morgan',
          termsAccepted: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.role).toBe(UserRole.BUSINESS_OWNER);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('rejects registration with a duplicate email address', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({ email: 'existing@flexora.com' } as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@flexora.com',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          firstName: 'Existing',
          lastName: 'User',
          termsAccepted: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('validates password complexity (rejects weak passwords)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@flexora.com',
          password: 'simple',
          confirmPassword: 'simple',
          firstName: 'Test',
          lastName: 'User',
          termsAccepted: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('2. Login and Credential Validation', () => {
    it('succeeds with valid credentials and sets HttpOnly refresh cookie', async () => {
      const hashed = await bcrypt.hash('ValidPass@123', 10);
      const mockUser = {
        _id: '507f1f77bcf86cd799439012',
        email: 'owner@flexora.com',
        firstName: 'Sarah',
        lastName: 'Owner',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.ACTIVE,
        comparePassword: async (p: string) => bcrypt.compare(p, hashed),
        save: vi.fn().mockResolvedValue(true),
        toSafeJSON() {
          return {
            id: '507f1f77bcf86cd799439012',
            email: 'owner@flexora.com',
            role: UserRole.BUSINESS_OWNER,
            status: AccountStatus.ACTIVE,
          };
        },
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
      vi.spyOn(RefreshSession, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'owner@flexora.com',
          password: 'ValidPass@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('fails with invalid credentials', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nobody@flexora.com',
          password: 'WrongPassword@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('rejects login if account is SUSPENDED', async () => {
      const hashed = await bcrypt.hash('ValidPass@123', 10);
      const mockUser = {
        _id: '507f1f77bcf86cd799439013',
        email: 'suspended@flexora.com',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.SUSPENDED,
        comparePassword: async (p: string) => bcrypt.compare(p, hashed),
        save: vi.fn(),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'suspended@flexora.com',
          password: 'ValidPass@123',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Account suspended');
    });
  });

  describe('3. Role-Based Access Control (RBAC)', () => {
    it('blocks unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });

    it('prevents Business Owner from accessing Platform Admin APIs (403 Forbidden)', async () => {
      const ownerToken = signAccessToken({
        userId: '507f1f77bcf86cd799439014',
        email: 'owner@flexora.com',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.ACTIVE,
      });

      vi.spyOn(User, 'findById').mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        email: 'owner@flexora.com',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('allows Platform Admin to access Platform Admin dashboard', async () => {
      const adminToken = signAccessToken({
        userId: '507f1f77bcf86cd799439015',
        email: 'admin@flexora.com',
        role: UserRole.PLATFORM_ADMIN,
        status: AccountStatus.ACTIVE,
      });

      vi.spyOn(User, 'findById').mockResolvedValue({
        _id: '507f1f77bcf86cd799439015',
        email: 'admin@flexora.com',
        role: UserRole.PLATFORM_ADMIN,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
      } as any);

      vi.spyOn(User, 'countDocuments').mockResolvedValue(10 as any);
      vi.spyOn(User, 'find').mockReturnValue({
        sort: () => ({ limit: () => ({ select: () => Promise.resolve([]) }) }),
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.stats).toBeDefined();
    });

    it('prevents regular users from changing their own role via profile update', async () => {
      const userToken = signAccessToken({
        userId: '507f1f77bcf86cd799439016',
        email: 'owner@flexora.com',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.ACTIVE,
      });

      const mockDbUser = {
        _id: '507f1f77bcf86cd799439016',
        email: 'owner@flexora.com',
        firstName: 'Sarah',
        lastName: 'Owner',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.ACTIVE,
        save: vi.fn().mockResolvedValue(true),
        toSafeJSON() {
          return {
            id: '507f1f77bcf86cd799439016',
            firstName: 'Updated',
            lastName: 'Name',
            role: UserRole.BUSINESS_OWNER, // role unchanged
          };
        },
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockDbUser as any);

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          role: UserRole.PLATFORM_ADMIN, // Attempt privilege escalation
        });

      expect(res.status).toBe(200);
      // Profile update ignores role field
      expect(mockDbUser.role).toBe(UserRole.BUSINESS_OWNER);
    });

    it('prevents accidental demotion of the last active Platform Admin', async () => {
      const adminToken = signAccessToken({
        userId: '507f1f77bcf86cd799439017',
        email: 'admin@flexora.com',
        role: UserRole.PLATFORM_ADMIN,
        status: AccountStatus.ACTIVE,
      });

      const lastAdmin = {
        _id: '507f1f77bcf86cd799439017',
        email: 'admin@flexora.com',
        role: UserRole.PLATFORM_ADMIN,
        status: AccountStatus.ACTIVE,
      };

      vi.spyOn(User, 'findById').mockResolvedValue(lastAdmin as any);
      vi.spyOn(User, 'countDocuments').mockResolvedValue(1 as any); // Only 1 active admin!

      const res = await request(app)
        .patch('/api/v1/admin/users/507f1f77bcf86cd799439017/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.BUSINESS_OWNER });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot demote the last active Platform Admin');
    });
  });

  describe('4. Token Rotation & Session Revocation', () => {
    it('rotates refresh token and returns new access token', async () => {
      const { signRefreshToken } = await import('../utils/jwt.js');
      const testToken = signRefreshToken('507f1f77bcf86cd799439018');
      const sessionExpires = new Date();
      sessionExpires.setDate(sessionExpires.getDate() + 5);

      const mockSession = {
        user: '507f1f77bcf86cd799439018',
        tokenHash: 'somehash',
        expiresAt: sessionExpires,
        isRevoked: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(RefreshSession, 'findOne').mockResolvedValue(mockSession as any);
      vi.spyOn(RefreshSession, 'create').mockResolvedValue({} as any);
      vi.spyOn(User, 'findById').mockResolvedValue({
        _id: '507f1f77bcf86cd799439018',
        email: 'user@flexora.com',
        role: UserRole.BUSINESS_OWNER,
        status: AccountStatus.ACTIVE,
        toSafeJSON() {
          return { id: '507f1f77bcf86cd799439018', email: 'user@flexora.com' };
        },
      } as any);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`flexora_rt=${testToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(mockSession.isRevoked).toBe(true);
    });

    it('triggers reuse detection when a revoked token is presented', async () => {
      const { signRefreshToken } = await import('../utils/jwt.js');
      const testToken = signRefreshToken('507f1f77bcf86cd799439019');

      const mockRevokedSession = {
        user: '507f1f77bcf86cd799439019',
        isRevoked: true,
      };

      vi.spyOn(RefreshSession, 'findOne').mockResolvedValue(mockRevokedSession as any);
      const updateManySpy = vi.spyOn(RefreshSession, 'updateMany').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`flexora_rt=${testToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Compromised session detected');
      expect(updateManySpy).toHaveBeenCalledWith(
        { user: '507f1f77bcf86cd799439019', isRevoked: false },
        expect.any(Object)
      );
    });
  });

  describe('5. Password Reset Workflow', () => {
    it('generates a password reset token and stores hash with expiration', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439020',
        email: 'user@flexora.com',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'user@flexora.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('instructions have been sent');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});

