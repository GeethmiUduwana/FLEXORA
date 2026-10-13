import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole, AccountStatus } from '../types/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication token missing or invalid',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          status: 'error',
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired',
        });
        return;
      }
      res.status(401).json({
        status: 'error',
        message: 'Invalid access token',
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User no longer exists',
      });
      return;
    }

    if (user.status === AccountStatus.SUSPENDED) {
      res.status(403).json({
        status: 'error',
        message: 'Account has been suspended. Please contact platform support.',
      });
      return;
    }

    if (user.status === AccountStatus.INACTIVE) {
      res.status(403).json({
        status: 'error',
        message: 'Account is deactivated. Please contact an administrator.',
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    req.tokenPayload = payload;

    next();
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error during authentication' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: `Forbidden: this resource requires one of the following roles: [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

export const requirePlatformAdmin = requireRole(UserRole.PLATFORM_ADMIN);
export const requireBusinessOwner = requireRole(UserRole.BUSINESS_OWNER);
