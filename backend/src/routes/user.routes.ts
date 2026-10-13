import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/me', UserController.getMe);
router.patch('/me', validateBody(updateProfileSchema), UserController.updateMe);
router.patch('/me/password', validateBody(changePasswordSchema), UserController.changePassword);

export default router;
