import bcrypt from 'bcryptjs';
import { User, IUserDocument } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { UserRole, AccountStatus, AccessTokenPayload } from '../types/index.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashToken, generateRandomToken } from '../utils/crypto.js';

const BCRYPT_SALT_ROUNDS = 12;
const REFRESH_EXPIRES_DAYS = 7;

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error: any = new Error('An account with this email address already exists');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    const user = new User({
      email: normalizedEmail,
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: UserRole.BUSINESS_OWNER, // Enforce Business Owner role for public registration
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      lastLoginAt: new Date(),
    });

    await user.save();

    // Prepare tenant membership placeholder
    const tenantId = `tenant_${user._id.toString()}`;
    await BusinessMembership.create({
      user: user._id,
      tenantId,
      role: UserRole.BUSINESS_OWNER,
    });

    const accessTokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = signAccessToken(accessTokenPayload);
    const refreshToken = signRefreshToken(user._id.toString());
    const tokenHash = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await RefreshSession.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    };
  }

  static async login(
    data: { email: string; password: string },
    sessionMeta?: { userAgent?: string; ipAddress?: string }
  ) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === AccountStatus.SUSPENDED) {
      const error: any = new Error('Account suspended. Please contact platform support.');
      error.statusCode = 403;
      throw error;
    }

    if (user.status === AccountStatus.INACTIVE) {
      const error: any = new Error('Account is inactive. Please contact an administrator.');
      error.statusCode = 403;
      throw error;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessTokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = signAccessToken(accessTokenPayload);
    const refreshToken = signRefreshToken(user._id.toString());
    const tokenHash = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await RefreshSession.create({
      user: user._id,
      tokenHash,
      expiresAt,
      userAgent: sessionMeta?.userAgent || null,
      ipAddress: sessionMeta?.ipAddress || null,
    });

    return {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    };
  }

  static async refresh(rawRefreshToken: string) {
    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      const error: any = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const session = await RefreshSession.findOne({ tokenHash });

    if (!session) {
      const error: any = new Error('Session not found or expired');
      error.statusCode = 401;
      throw error;
    }

    // Reuse detection
    if (session.isRevoked) {
      // Possible compromise: revoke all sessions for this user
      await RefreshSession.updateMany(
        { user: session.user, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
      const error: any = new Error('Compromised session detected. All sessions revoked. Please log in again.');
      error.statusCode = 401;
      throw error;
    }

    if (session.expiresAt < new Date()) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();
      const error: any = new Error('Refresh session expired. Please log in again.');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(session.user);
    if (!user || user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.INACTIVE) {
      const error: any = new Error('User account is invalid or no longer active');
      error.statusCode = 403;
      throw error;
    }

    // Rotate refresh token
    const newRefreshToken = signRefreshToken(user._id.toString());
    const newTokenHash = hashToken(newRefreshToken);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await RefreshSession.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    });

    // Revoke old session
    session.isRevoked = true;
    session.revokedAt = new Date();
    session.replacedByTokenHash = newTokenHash;
    await session.save();

    const accessTokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = signAccessToken(accessTokenPayload);

    return {
      user: user.toSafeJSON(),
      accessToken,
      newRefreshToken,
    };
  }

  static async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshSession.updateOne(
      { tokenHash, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  static async logoutAll(userId: string) {
    await RefreshSession.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  static async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Avoid revealing user existence
      return { message: 'If an account exists with this email, password reset instructions have been sent.' };
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    user.passwordResetTokenHash = tokenHash;
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry
    user.passwordResetExpires = expires;
    await user.save();

    // Dev preview URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
    console.log(`\n========================================\n[PASSWORD RESET LINK for ${user.email}]:\n${resetUrl}\n========================================\n`);

    return {
      message: 'If an account exists with this email, password reset instructions have been sent.',
      developmentResetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
      developmentResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      const error: any = new Error('Password reset token is invalid or has expired');
      error.statusCode = 400;
      throw error;
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    // Revoke all sessions for security
    await RefreshSession.updateMany(
      { user: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }
}
