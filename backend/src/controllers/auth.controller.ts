import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie, REFRESH_COOKIE_NAME } from '../utils/cookies.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(201).json({
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionMeta = {
        userAgent: req.headers['user-agent'] as string | undefined,
        ipAddress: req.ip as string | undefined,
      };

      const result = await AuthService.login(req.body, sessionMeta);
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(200).json({
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({
          status: 'error',
          message: 'Refresh token missing',
        });
        return;
      }

      const result = await AuthService.refresh(token);
      setRefreshTokenCookie(res, result.newRefreshToken);
      res.status(200).json({
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      clearRefreshTokenCookie(res);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      if (token) {
        await AuthService.logout(token);
      }
      clearRefreshTokenCookie(res);
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }
      await AuthService.logoutAll(req.user.id);
      clearRefreshTokenCookie(res);
      res.status(200).json({
        status: 'success',
        message: 'All active sessions have been revoked',
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      res.status(200).json({
        status: 'success',
        message: result.message,
        ...(result.developmentResetToken && {
          devToken: result.developmentResetToken,
          devResetUrl: result.developmentResetUrl,
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body.token, req.body.password);
      clearRefreshTokenCookie(res);
      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
