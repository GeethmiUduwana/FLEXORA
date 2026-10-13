import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Strict rate limiters for auth endpoints against brute force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  AuthController.login
);

router.post('/refresh', AuthController.refresh);

router.post('/logout', AuthController.logout);

router.post('/logout-all', requireAuth, AuthController.logoutAll);

router.get('/me', requireAuth, AuthController.me);

router.post(
  '/forgot-password',
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  AuthController.resetPassword
);

export default router;
