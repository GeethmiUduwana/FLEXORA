import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateStatusSchema, updateRoleSchema } from '../validators/auth.validator.js';

const router = Router();

// Protect all admin endpoints with authentication AND Platform Admin authorization
router.use(requireAuth, requirePlatformAdmin);

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/status', validateBody(updateStatusSchema), AdminController.updateStatus);
router.patch('/users/:id/role', validateBody(updateRoleSchema), AdminController.updateRole);

export default router;
