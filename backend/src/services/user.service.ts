import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';

const BCRYPT_SALT_ROUNDS = 12;

export class UserService {
  static async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user.toSafeJSON();
  }

  static async updateProfile(userId: string, data: { firstName: string; lastName: string }) {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Explicitly update only first and last name to prevent privilege escalation
    user.firstName = data.firstName.trim();
    user.lastName = data.lastName.trim();
    await user.save();

    return user.toSafeJSON();
  }

  static async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await user.comparePassword(data.currentPassword);
    if (!isMatch) {
      const error: any = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    user.passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_SALT_ROUNDS);
    await user.save();

    // Revoke all sessions for security
    await RefreshSession.updateMany(
      { user: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    return { message: 'Password changed successfully' };
  }
}
