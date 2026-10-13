import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';

const router = Router();

router.get('/', CategoryController.getCategories);
router.get('/:id/types', CategoryController.getTypesByCategory);

export default router;
