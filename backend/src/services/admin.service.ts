import { User } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { BusinessCategory } from '../models/BusinessCategory.js';
import { BusinessType } from '../models/BusinessType.js';
import { ModuleCategory } from '../models/ModuleCategory.js';
import { BusinessModule } from '../models/BusinessModule.js';
import { UserRole, AccountStatus, CategoryStatus, ModuleStatus } from '../types/index.js';

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
      totalBusinessCategories,
      activeBusinessCategories,
      totalBusinessTypes,
      totalModuleCategories,
      totalModules,
      activeModules,
      inactiveModules,
      archivedModules,
      modulesWithDependencies,
      modulesWithoutRecommendations,
      recentModules,
      modulesByCategoryGroup,
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
      BusinessCategory.countDocuments({}),
      BusinessCategory.countDocuments({ status: CategoryStatus.ACTIVE }),
      BusinessType.countDocuments({}),
      ModuleCategory.countDocuments({}),
      BusinessModule.countDocuments({}),
      BusinessModule.countDocuments({ status: ModuleStatus.ACTIVE }),
      BusinessModule.countDocuments({ status: ModuleStatus.INACTIVE }),
      BusinessModule.countDocuments({ status: ModuleStatus.ARCHIVED }),
      BusinessModule.countDocuments({ 'dependencies.0': { $exists: true } }),
      BusinessModule.countDocuments({ 'recommendedBusinessTypes.0': { $exists: false } }),
      BusinessModule.find({})
        .populate('moduleCategoryId', 'name slug')
        .sort({ updatedAt: -1 })
        .limit(6),
      BusinessModule.aggregate([
        { $match: { status: { $ne: ModuleStatus.ARCHIVED } } },
        { $group: { _id: '$moduleCategoryId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'modulecategories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        { $project: { _id: 1, name: '$category.name', count: 1 } },
        { $sort: { count: -1 } },
      ]),
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
        totalBusinessCategories,
        activeBusinessCategories,
        totalBusinessTypes,
        totalModuleCategories,
        totalModules,
        activeModules,
        inactiveModules,
        archivedModules,
        modulesWithDependencies,
        modulesWithoutRecommendations,
      },
      recentUsers: recentUsers.map((u) => u.toSafeJSON()),
      recentModules: recentModules.map((m) => m.toSafeJSON()),
      modulesByCategoryGroup,
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
