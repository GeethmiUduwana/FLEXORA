import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createBusinessSchema, updateBusinessSchema } from '../validators/business.validator.js';

const router = Router();

// All business routes require valid authentication
router.use(requireAuth);

router.post('/', validateBody(createBusinessSchema), BusinessController.createBusiness);
router.get('/my', BusinessController.getMyBusinesses);
router.get('/:id', BusinessController.getBusinessById);
router.patch('/:id', validateBody(updateBusinessSchema), BusinessController.updateBusiness);

export default router;
