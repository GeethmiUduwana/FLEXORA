import { User } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { UserRole, AccountStatus } from '../types/index.js';

export class AdminService {
  static async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      businessOwners,
      managers,
      staff,
      platformAdmins,
      suspendedUsers,
      pendingUsers,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: AccountStatus.ACTIVE }),
      User.countDocuments({ role: UserRole.BUSINESS_OWNER }),
      User.countDocuments({ role: UserRole.MANAGER }),
      User.countDocuments({ role: UserRole.STAFF }),
      User.countDocuments({ role: UserRole.PLATFORM_ADMIN }),
      User.countDocuments({ status: AccountStatus.SUSPENDED }),
      User.countDocuments({ status: AccountStatus.PENDING_VERIFICATION }),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('-passwordHash'),
    ]);

    return {
      stats: {
        totalUsers,
        activeUsers,
        businessOwners,
        managers,
        staff,
        platformAdmins,
        suspendedUsers,
        pendingUsers,
      },
      recentUsers: recentUsers.map((u) => u.toSafeJSON()),
      placeholders: {
        categories: { status: 'NOT_IMPLEMENTED', message: 'Category management will be available in Step 2' },
        businessTypes: { status: 'NOT_IMPLEMENTED', message: 'Business type configuration will be available in Step 2' },
        modules: { status: 'NOT_IMPLEMENTED', message: 'Module marketplace configuration will be available in Step 3' },
      },
    };
  }

  static async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (options.role && Object.values(UserRole).includes(options.role as UserRole)) {
      filter.role = options.role;
    }

    if (options.status && Object.values(AccountStatus).includes(options.status as AccountStatus)) {
      filter.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const sanitized = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { email: { $regex: sanitized, $options: 'i' } },
        { firstName: { $regex: sanitized, $options: 'i' } },
        { lastName: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [totalCount, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash'),
    ]);

    return {
      users: users.map((u) => u.toSafeJSON()),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  static async getUserById(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user.toSafeJSON();
  }

  static async updateUserStatus(
    targetUserId: string,
    newStatus: AccountStatus,
    currentAdminId: string
  ) {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      const error: any = new Error('Target user not found');
      error.statusCode = 404;
      throw error;
    }

    // Protection rule: Prevent disabling the last active Platform Admin
    if (
      targetUser.role === UserRole.PLATFORM_ADMIN &&
      (newStatus === AccountStatus.INACTIVE || newStatus === AccountStatus.SUSPENDED)
    ) {
      const activeAdminCount = await User.countDocuments({
        role: UserRole.PLATFORM_ADMIN,
        status: AccountStatus.ACTIVE,
      });

      if (activeAdminCount <= 1) {
        const error: any = new Error(
          'Security violation: Cannot deactivate or suspend the last active Platform Admin'
        );
        error.statusCode = 400;
        throw error;
      }
    }

    targetUser.status = newStatus;
    await targetUser.save();

    // If account was suspended or deactivated, immediately revoke all active refresh tokens
    if (newStatus === AccountStatus.INACTIVE || newStatus === AccountStatus.SUSPENDED) {
      await RefreshSession.updateMany(
        { user: targetUser._id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    return targetUser.toSafeJSON();
  }

  static async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    currentAdminId: string
  ) {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      const error: any = new Error('Target user not found');
      error.statusCode = 404;
      throw error;
    }

    // Protection rule: Prevent demoting the last active Platform Admin
    if (
      targetUser.role === UserRole.PLATFORM_ADMIN &&
      newRole !== UserRole.PLATFORM_ADMIN
    ) {
      const activeAdminCount = await User.countDocuments({
        role: UserRole.PLATFORM_ADMIN,
        status: AccountStatus.ACTIVE,
      });

      if (activeAdminCount <= 1) {
        const error: any = new Error(
          'Security violation: Cannot demote the last active Platform Admin'
        );
        error.statusCode = 400;
        throw error;
      }
    }

    targetUser.role = newRole;
    await targetUser.save();

    return targetUser.toSafeJSON();
  }
}
